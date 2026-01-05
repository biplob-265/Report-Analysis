
import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          onDataLoaded(Array.isArray(json) ? json : [json], fileName);
        } catch (err) {
          setError('Invalid JSON format');
        }
      };
      reader.readAsText(file);
    } else if (extension === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim();
          });
          return obj;
        }).filter(item => Object.values(item).some(val => val));
        onDataLoaded(data, fileName);
      };
      reader.readAsText(file);
    } else {
      setError('Unsupported file type. Please upload CSV or JSON.');
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

  return (
    <div className="max-w-2xl mx-auto">
      <div 
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <h3 className="text-xl font-semibold">Analyzing Data...</h3>
            <p className="text-slate-500">Gemini is processing your dataset to uncover insights.</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload your dataset</h3>
            <p className="text-slate-500 mb-8">
              Drag and drop your file here, or click to browse.<br />
              Supports CSV and JSON files.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Choose File
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <h4 className="font-semibold">Automated Insights</h4>
          </div>
          <p className="text-sm text-slate-600">Our AI identifies anomalies, trends, and key performance indicators automatically.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <h4 className="font-semibold">Instant Visualization</h4>
          </div>
          <p className="text-sm text-slate-600">Get suggested charts that best represent your data structure and distribution.</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
