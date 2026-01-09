
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeData = async (data: any[], fileName: string, config: AnalysisConfig): Promise<AnalysisResult> => {
  // Deep column profiling for "Accurate Results"
  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  
  const columnProfiles = allColumns.map(col => {
    const values = data.map(d => d[col]).filter(v => v !== null && v !== undefined);
    const numericValues = values.map(Number).filter(n => !isNaN(n));
    const uniqueValues = Array.from(new Set(values));
    const isNumeric = numericValues.length > values.length * 0.8 && values.length > 0;
    
    let profile = `${col}: `;
    if (isNumeric) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      profile += `Numeric (Range: ${min.toLocaleString()} to ${max.toLocaleString()}, Mean: ${avg.toFixed(2)})`;
    } else {
      // Categorical "Levels" analysis
      const levelCount = uniqueValues.length;
      if (levelCount <= 15) {
        profile += `Categorical (${levelCount} Levels: [${uniqueValues.slice(0, 10).join(', ')}${levelCount > 10 ? '...' : ''}])`;
      } else {
        profile += `Categorical (${levelCount} unique values detected)`;
      }
    }
    return profile;
  }).join('\n');

  // Intelligent sampling for context preservation
  const sampleSize = 25;
  const first = data.slice(0, sampleSize);
  const middle = data.slice(Math.floor(data.length / 2) - 12, Math.floor(data.length / 2) + 13);
  const last = data.slice(-sampleSize);
  const sampleData = [...first, ...middle, ...last];
  
  const dataString = JSON.stringify(sampleData);

  const modelName = config.model === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const detailInstruction = {
    concise: "Provide a very brief, high-level overview. Keep insights to a minimum (max 3).",
    standard: "Provide a balanced analysis with a medium level of detail and around 5-7 key insights.",
    exhaustive: "Provide a deep-dive, thorough analysis. Explore every nuance and provide 10+ detailed insights."
  }[config.detailLevel];

  const featureInstructions = [];
  if (config.features.trendPrediction) featureInstructions.push("- Perform trend prediction: Identify where the data is likely heading based on sequential patterns.");
  if (config.features.anomalyDetection) featureInstructions.push("- Perform anomaly detection: Identify significant outliers, suspicious peaks, or uncharacteristic levels.");
  if (config.features.correlationAnalysis) featureInstructions.push("- Perform correlation analysis: Quantify relationships between independent categorical levels and numeric outcomes.");
  if (config.features.strategicForecasting) featureInstructions.push("- Perform strategic forecasting: Project business outcomes and provide specific, high-level recommendations.");

  const prompt = `Analyze the following dataset from "${fileName}" with high precision.
  
  DATASET ARCHITECTURE & PROFILING (ACCURACY REPORT):
  Total Observations: ${data.length.toLocaleString()}
  Column Metadata (Levels & Distributions):
  ${columnProfiles}

  ANALYSIS PARAMETERS:
  - Resolution: ${config.detailLevel} (${detailInstruction})
  - Enabled Intelligence Modules:
    ${featureInstructions.join('\n    ')}

  REPORT REQUIREMENTS:
  1. EXECUTIVE SUMMARY: Define the dataset's purpose and primary findings.
  2. DEEP INSIGHTS: High-fidelity trends derived from column relationships.
  3. PERFORMANCE PULSE: 
     - Strengths: Identifying peak performance levels and positive trajectories.
     - Risks: Identifying level-specific anomalies and critical intervention points.
  4. VISUALIZATION MAPPING: Generate 4-6 chart configs.
     - Types: 'bar', 'line', 'pie', 'area', 'scatter', 'radar', 'roc'.
     - Ensure 'xAxis' and 'yAxis' use exact column names from profiling.
     - Use 'roc' specifically if classification metrics like True Positive Rate (TPR) or False Positive Rate (FPR) are detected.
  5. GLOBAL STATISTICS: High-level metrics representing the entire dataset range.

  REPRESENTATIVE DATA RECORDS (FOR LEVEL ENCODING CONTEXT):
  ${dataString}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          performancePulse: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["strengths", "risks"]
          },
          statistics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING }
              }
            }
          },
          suggestedCharts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                xAxis: { type: Type.STRING },
                yAxis: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          }
        },
        required: ["summary", "insights", "suggestedCharts", "statistics", "performancePulse"]
      },
      thinkingConfig: config.model === 'pro' ? { thinkingBudget: 32768 } : undefined
    }
  });

  const result = JSON.parse(response.text || '{}');
  
  const enrichedCharts = (result.suggestedCharts || []).map((chart: any) => {
    return {
      ...chart,
      data: data.slice(0, 100) // Pass 100 rows for more accurate visual distribution
    };
  });

  return {
    ...result,
    suggestedCharts: enrichedCharts
  };
};
