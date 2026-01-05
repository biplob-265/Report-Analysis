
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Always use the recommended initialization pattern
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeData = async (data: any[], fileName: string): Promise<AnalysisResult> => {
  // Sample the data if it's too large for the prompt
  const sampleData = data.slice(0, 50);
  const dataString = JSON.stringify(sampleData);

  const prompt = `Analyze the following dataset from a file named "${fileName}". 
  Generate a comprehensive data analysis report including:
  1. A concise summary of what the data represents.
  2. Key insights and trends found in the data.
  3. Suggestions for visualizations with specific X and Y axis mappings. 
     Supported types: 'bar', 'line', 'pie', 'area', 'scatter' (for correlations), or 'radar' (for categorical comparisons).
     IMPORTANT: For 'scatter' and 'radar' charts, try to identify a 'category' column (a column with string labels) to group the data points.
  4. Top-level statistics (e.g., total count, averages of numerical columns, etc.).

  Dataset sample: ${dataString}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
                type: { type: Type.STRING, description: "Must be 'bar', 'line', 'pie', 'area', 'scatter', or 'radar'" },
                title: { type: Type.STRING },
                xAxis: { type: Type.STRING },
                yAxis: { type: Type.STRING },
                category: { type: Type.STRING, description: "Optional column name to group data points (e.g., 'Region', 'Type', 'Status')" }
              }
            }
          }
        },
        required: ["summary", "insights", "suggestedCharts", "statistics"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  
  // Transform suggested charts to include actual data mappings
  const enrichedCharts = (result.suggestedCharts || []).map((chart: any) => {
    return {
      ...chart,
      data: data.slice(0, 20)
    };
  });

  return {
    ...result,
    suggestedCharts: enrichedCharts
  };
};
