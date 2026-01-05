
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import Pricing from './components/Pricing';
import ChatBot from './components/ChatBot';
import LiveSession from './components/LiveSession';
import { AppView, Report, AnalysisResult, AnalysisConfig, DataRow } from './types';
import { analyzeData } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { FileBarChart, Clock, Database, ChevronRight, Play, FileText, Zap, Sparkles, Trash2, AlertTriangle, Mic } from 'lucide-react';

const STORAGE_KEY = 'insight_stream_reports';
const MAX_PREVIEW_ROWS = 100;

const App: React.FC = () => {
  const [currentView, setView] = useState<AppView>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [quickInsight, setQuickInsight] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setReports(JSON.parse(saved)); } 
      catch (e) { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);

  const saveReportsToStorage = (updatedReports: Report[]) => {
    const compactReports = updatedReports.map(report => ({
      ...report,
      data: report.data.slice(0, MAX_PREVIEW_ROWS)
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactReports));
      setStorageError(false);
    } catch (e) {
      if (updatedReports.length > 1) saveReportsToStorage(updatedReports.slice(0, -1));
      else setStorageError(true);
    }
  };

  const handleDataLoaded = async (data: any[], fileName: string, config: AnalysisConfig) => {
    setIsAnalyzing(true);
    setQuickInsight(null);
    setStorageError(false);
    
    // Switch view to show the processing state if it was an upload
    if (currentView !== 'upload') setView('upload');

    const generateQuickInsight = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sample = JSON.stringify(data.slice(0, 10));
        const res = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Provide a one-sentence "Flash Insight" for this dataset: ${sample}`,
        });
        setQuickInsight(res.text || "Dataset detected.");
      } catch (e) {}
    };
    generateQuickInsight();
    
    try {
      const result = await analyzeData(data, fileName, config);
      const newReport: Report = {
        id: Date.now().toString(),
        name: fileName.replace(/\.[^/.]+$/, ""),
        date: new Date().toLocaleDateString(),
        analysis: result,
        data: data
      };
      const updatedReports = [newReport, ...reports.filter(r => r.name !== newReport.name)];
      setReports(updatedReports);
      saveReportsToStorage(updatedReports);
      setActiveReport(newReport);
      setView('analysis');
    } catch (err) {
      alert("Something went wrong during analysis.");
    } finally { setIsAnalyzing(false); }
  };

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    saveReportsToStorage(updated);
    if (activeReport?.id === id) setActiveReport(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
                  Unlock hidden <span className="text-indigo-600">stories</span> in your data.
                </h1>
                <p className="text-lg text-slate-500 mb-8">
                  Upload any CSV or JSON and let Gemini 3 generate enterprise-grade reports, 
                  visualizations, and actionable insights in seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setView('upload')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"><Play className="w-4 h-4" /> Start Analysis</button>
                  <button onClick={() => setIsLiveOpen(true)} className="bg-indigo-50 text-indigo-700 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"><Mic className="w-4 h-4" /> Live Voice Chat</button>
                </div>
              </div>
              <div className="hidden lg:block relative">
                 <div className="w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl absolute -z-10 animate-pulse" />
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xs rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><FileBarChart className="text-indigo-600" /></div>
                      <div><p className="text-sm font-bold">Revenue Report</p><p className="text-xs text-slate-400">Analysis complete</p></div>
                    </div>
                    <div className="space-y-3"><div className="h-4 bg-slate-50 rounded-full w-full" /><div className="h-4 bg-slate-50 rounded-full w-3/4" /><div className="h-4 bg-slate-50 rounded-full w-5/6" /></div>
                 </div>
              </div>
            </header>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Recent Reports</h2>
                <button onClick={() => setView('history')} className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight className="w-4 h-4" /></button>
              </div>
              {reports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.slice(0, 3).map((report) => (
                    <div key={report.id} onClick={() => { setActiveReport(report); setView('analysis'); }} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors"><Database className="text-slate-400 group-hover:text-indigo-600 w-6 h-6" /></div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {report.date}</span>
                          <button onClick={(e) => deleteReport(report.id, e)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{report.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{report.analysis.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center"><button onClick={() => setView('upload')} className="text-indigo-600 font-bold hover:underline">Analyze your first dataset →</button></div>
              )}
            </section>
          </div>
        );
      case 'upload':
        return <div className="py-12 space-y-6"><FileUpload onDataLoaded={handleDataLoaded} isLoading={isAnalyzing} />{isAnalyzing && quickInsight && <div className="max-w-2xl mx-auto p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 animate-pulse"><Zap className="text-indigo-600 w-5 h-5 flex-shrink-0" /><p className="text-sm text-indigo-800 font-medium"><span className="font-bold">Instant Fact:</span> {quickInsight}</p></div>}</div>;
      case 'analysis':
        return activeReport ? (
          <AnalysisDashboard 
            analysis={activeReport.analysis} 
            reportName={activeReport.name} 
            data={activeReport.data} 
            onReanalyze={handleDataLoaded}
          />
        ) : (
          <div className="text-center py-20"><p>No active report.</p></div>
        );
      case 'history':
        return <div className="max-w-4xl mx-auto"><div className="flex items-center justify-between mb-8"><h1 className="text-3xl font-bold">Report History</h1></div><div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">{reports.length > 0 ? <div className="divide-y divide-slate-100">{reports.map((report) => <div key={report.id} className="group p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setActiveReport(report); setView('analysis'); }}><div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center"><FileText className="text-indigo-600" /></div><div><p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.name}</p><p className="text-xs text-slate-400">{report.date}</p></div></div><ChevronRight className="text-slate-300 w-5 h-5" /></div>)}</div> : <p className="p-12 text-center text-slate-500">No reports found.</p>}</div></div>;
      case 'billing': return <Pricing />;
      default: return <div>View not found.</div>;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView}>
      {renderView()}
      <ChatBot activeReport={activeReport} />
      {isLiveOpen && <LiveSession onClose={() => setIsLiveOpen(false)} />}
    </Layout>
  );
};

export default App;
