
import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Database, Info, Layers } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [samplingRate, setSamplingRate] = useState<number>(100);
  const [fileStats, setFileStats] = useState<{ name: string; totalRows: number; sampledRows: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const applySampling = (data: any[]) => {
    if (samplingRate === 100 || data.length <= 1) return data;
    
    const sampleSize = Math.floor((data.length * samplingRate) / 100);
    const result = [];
    const step = data.length / sampleSize;
    
    // Systematic sampling for better performance and distribution coverage
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
      const sampledData = applySampling(data);
      setFileStats({
        name: fileName,
        totalRows: data.length,
        sampledRows: sampledData.length
      });
      onDataLoaded(sampledData, fileName);
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
        const rows = text.split('\n').filter(row => row.trim()).map(row => {
          // Robust CSV splitting (basic)
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
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim();
          });
          return obj;
        }).filter(item => Object.values(item).some(val => val));
        handleLoad(data);
      };
      reader.readAsText(file);
    } else {
      setError('Unsupported file type. Please upload a .CSV or .JSON file.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json"
          className="hidden"
        />

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
                  Analyzing {fileStats.sampledRows.toLocaleString()} of {fileStats.totalRows.toLocaleString()} rows
                </div>
              )}
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Our Gemini model is currently extracting trends and mapping your visualizations.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 group">
              <Upload className="w-12 h-12 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">Analyze Dataset</h3>
            <p className="text-slate-500 mb-10 text-lg">
              Drop your CSV or JSON file to start the magic.<br />
              <span className="text-sm font-medium">Supports high-volume datasets with custom sampling.</span>
            </p>

            <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Analysis Depth</p>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-300 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-left leading-relaxed">
                    Higher sampling provides better trend accuracy but may take longer to process very large files (>50MB).
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {rates.map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSamplingRate(rate)}
                    className={`px-4 py-3 rounded-2xl text-sm font-black transition-all border-2 ${
                      samplingRate === rate 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 translate-y-[-2px]' 
                        : 'bg-white border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex items-center gap-2 justify-center text-[11px] font-bold">
                {samplingRate === 100 ? (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Full Dataset Precision
                  </span>
                ) : (
                  <span className="text-indigo-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> High Performance Sampling Active
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="group bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center gap-3 mx-auto"
            >
              Select File
              <FileText className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-8 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-700 animate-in shake duration-300">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm leading-snug">{error}</p>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CheckCircle className="text-emerald-600 w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">AI Trend Mapping</h4>
          </div>
          <p className="text-slate-500 leading-relaxed text-sm">
            Automatically identify growth patterns, outliers, and seasonal variations without writing a single line of Python or SQL.
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Layers className="text-indigo-600 w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">Smart Projections</h4>
          </div>
          <p className="text-slate-500 leading-relaxed text-sm">
            Our platform uses the Gemini 3 multi-modal engine to suggest the most impactful visualization layouts for your specific data structure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
