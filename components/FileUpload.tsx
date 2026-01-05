
import React, { useRef, useState } from 'react';
import { 
  Upload, FileText, AlertCircle, CheckCircle, Loader2, Database, 
  Info, Layers, Settings2, ChevronDown, ChevronUp, Cpu, 
  Target, Activity, TrendingUp, AlertTriangle, Zap, Binary
} from 'lucide-react';
import { AnalysisConfig } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string, config: AnalysisConfig) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [samplingRate, setSamplingRate] = useState<number>(100);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [config, setConfig] = useState<AnalysisConfig>({
    model: 'pro',
    detailLevel: 'standard',
    features: {
      trendPrediction: true,
      anomalyDetection: false,
      correlationAnalysis: true,
      strategicForecasting: false
    }
  });

  const [fileStats, setFileStats] = useState<{ name: string; totalRows: number; sampledRows: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const tryParseValue = (val: string): any => {
    if (val === null || val === undefined || val === '') return null;
    const trimmed = val.trim();
    // Check if it looks like a number
    if (!isNaN(Number(trimmed)) && trimmed !== "") {
      return Number(trimmed);
    }
    // Check if it's a boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    return trimmed;
  };

  const applySampling = (data: any[]) => {
    if (samplingRate === 100 || data.length <= 1) return data;
    const sampleSize = Math.floor((data.length * samplingRate) / 100);
    const result = [];
    const step = data.length / sampleSize;
    for (let i = 0; i < sampleSize; i++) {
      const index = Math.floor(i * step);
      if (data[index]) result.push(data[index]);
    }
    return result;
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    const handleLoad = (data: any[]) => {
      // Automatic type conversion for accurate "level" detection and numeric calculation
      const typedData = data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          newRow[key] = typeof row[key] === 'string' ? tryParseValue(row[key]) : row[key];
        });
        return newRow;
      });

      const sampledData = applySampling(typedData);
      setFileStats({
        name: fileName,
        totalRows: typedData.length,
        sampledRows: sampledData.length
      });
      onDataLoaded(sampledData, fileName, config);
    };

    if (extension === 'json') {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          let data = Array.isArray(json) ? json : [json];
          handleLoad(data);
        } catch (err) {
          setError('Invalid JSON format. Please ensure the file is a valid JSON array or object.');
        }
      };
      reader.readAsText(file);
    } else if (extension === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split(/\r?\n/).filter(row => row.trim()).map(row => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        });

        if (rows.length < 2) {
          setError('CSV must contain headers and at least one data row.');
          return;
        }
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
        const data = rows.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            let val = row[i]?.trim() || "";
            // Remove wrapping quotes if present
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            obj[header] = val;
          });
          return obj;
        }).filter(item => Object.values(item).some(val => val !== ""));
        handleLoad(data);
      };
      reader.readAsText(file);
    } else {
      setError('Unsupported file type. Please upload a .CSV or .JSON file.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const toggleFeature = (feature: keyof typeof config.features) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] }
    }));
  };

  const rates = [10, 25, 50, 100];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div 
        className={`relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-300 overflow-hidden ${
          dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.json" className="hidden" />

        {isLoading ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl animate-pulse opacity-50" />
              <Loader2 className="w-20 h-20 text-indigo-600 animate-spin relative z-10" />
              <Database className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-3xl font-black text-slate-900">Processing Data</h3>
              {fileStats && (
                <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm inline-flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  Analyzing {fileStats.sampledRows.toLocaleString()} rows with Gemini 3 {config.model === 'pro' ? 'Pro' : 'Flash'}
                </div>
              )}
              <p className="text-slate-500 max-w-sm mx-auto mt-2">Intelligence engine is optimizing for your {config.detailLevel} report.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 group">
              <Upload className="w-12 h-12 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">Analyze Dataset</h3>
            <p className="text-slate-500 mb-6 text-lg">Drop your CSV or JSON file to start the magic.</p>

            <div className="mb-8 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden transition-all">
              <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Settings2 className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">AI Intelligence Tuning</span>
                </div>
                {isConfigOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {isConfigOpen && (
                <div className="px-6 pb-6 space-y-6 text-left border-t border-slate-200 pt-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Model Version</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setConfig({...config, model: 'flash'})} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${config.model === 'flash' ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent bg-slate-200/50 text-slate-500 hover:bg-slate-200'}`}>
                        <Zap className="w-4 h-4" /><div className="text-left"><p className="text-xs font-black">Flash 3</p><p className="text-[9px] opacity-70">Fast, efficient</p></div>
                      </button>
                      <button onClick={() => setConfig({...config, model: 'pro'})} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${config.model === 'pro' ? 'border-purple-600 bg-white text-purple-700' : 'border-transparent bg-slate-200/50 text-slate-500 hover:bg-slate-200'}`}>
                        <Cpu className="w-4 h-4" /><div className="text-left"><p className="text-xs font-black">Pro 3</p><p className="text-[9px] opacity-70">Deep reasoning</p></div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Report Detail</p>
                    <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                      {(['concise', 'standard', 'exhaustive'] as const).map(level => (
                        <button key={level} onClick={() => setConfig({...config, detailLevel: level})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${config.detailLevel === level ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analytical Modules</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => toggleFeature('trendPrediction')} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${config.features.trendPrediction ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <TrendingUp className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">Trends</span>
                      </button>
                      <button onClick={() => toggleFeature('anomalyDetection')} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${config.features.anomalyDetection ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">Anomalies</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sampling Precision</p>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-300 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-left leading-relaxed">Adjust data sampling rate for performance or depth.</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {rates.map(rate => (
                  <button key={rate} onClick={() => setSamplingRate(rate)} className={`px-4 py-3 rounded-2xl text-sm font-black transition-all border-2 ${samplingRate === rate ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-transparent text-slate-400 hover:bg-slate-100'}`}>{rate}%</button>
                ))}
              </div>
            </div>

            <button onClick={() => fileInputRef.current?.click()} className="group bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center gap-3 mx-auto">
              Select File
              <FileText className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </>
        )}
      </div>
      {error && <div className="mt-8 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-700"><AlertCircle className="w-6 h-6" /><p className="font-bold text-sm leading-snug">{error}</p></div>}
    </div>
  );
};

export default FileUpload;
