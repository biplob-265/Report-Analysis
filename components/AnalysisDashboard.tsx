
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, 
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ZAxis,
  ReferenceArea
} from 'recharts';
import { 
  Download, Share2, FileText, ChevronRight, Filter, Sparkles, 
  Image as ImageIcon, FileCode, FileType, ZoomIn, ZoomOut, RotateCcw,
  ExternalLink, Code, Link as LinkIcon, Check, GripVertical, FileJson, Columns, 
  Layers, X, CheckSquare, Square, Maximize2, Settings2, MoreHorizontal, Loader2,
  ListFilter, Hash, Search, Trash2, SlidersHorizontal, Palette, Plus, Pipette,
  ChevronDown, ChevronUp, ChevronsUpDown, ArrowUpDown, Table as TableIcon,
  ChevronLeft, ChevronRight as ChevronRightIcon, TableProperties, Camera, Settings,
  PlusCircle, Equal, ChevronRightSquare, MoveHorizontal, Grab, Copy, FileDown,
  Info, ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown, Target, ShieldCheck, 
  ListFilter as FilterIcon, Settings as SettingsIcon, Sliders, Eraser, Wand2, Shield,
  RefreshCw, MousePointer2, Plus as PlusIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AnalysisResult, ChartConfig, DataRow, AnalysisConfig } from '../types';
import { toPng, toSvg } from 'html-to-image';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  reportName: string;
  data: DataRow[];
  onReanalyze?: (data: DataRow[], name: string, config: AnalysisConfig) => void;
}

const PALETTES = {
  default: {
    name: 'Insight Indigo',
    colors: ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#ef4444']
  },
  nordic: {
    name: 'Nordic Frost',
    colors: ['#4361ee', '#4895ef', '#4cc9f0', '#f72585', '#7209b7', '#3a0ca3', '#3f37c9']
  },
  neon: {
    name: 'Cyber Neon',
    colors: ['#00f5d4', '#00bbf9', '#fee440', '#f15bb5', '#9b5de5', '#ff99c8', '#a9def9']
  },
  emerald: {
    name: 'Deep Emerald',
    colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#064e3b', '#065f46', '#047857']
  },
  ocean: {
    name: 'Oceanic Blue',
    colors: ['#0ea5e9', '#38bdf8', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#1e40af']
  },
  sunset: {
    name: 'Sunset Glow',
    colors: ['#f43f5e', '#fb923c', '#fbbf24', '#e11d48', '#be123c', '#9f1239', '#881337']
  }
};

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const CustomTooltip = ({ active, payload, label, xAxis, yAxis, type }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 text-sm animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-slate-900 mb-2 border-b border-slate-50 pb-1">
          {type === 'scatter' ? 'Point Data' : label}
        </p>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                  <span className="text-slate-500 font-medium">{item.name || yAxis}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface FilterRule {
  id: string;
  column: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'starts_with' | 'not_equals';
  value: string;
}

interface DataCleaningOptions {
  handleMissing: 'none' | 'drop' | 'impute_mean' | 'impute_mode' | 'impute_zero';
  removeDuplicates: boolean;
  standardizeText: boolean;
}

const FilterModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  filters: FilterRule[]; 
  setFilters: (f: FilterRule[]) => void;
  columns: string[];
  chartTitle: string;
}> = ({ isOpen, onClose, filters, setFilters, columns, chartTitle }) => {
  if (!isOpen) return null;

  const operators = [
    { id: 'equals', label: 'Equals' },
    { id: 'not_equals', label: 'Does Not Equal' },
    { id: 'contains', label: 'Contains' },
    { id: 'starts_with', label: 'Starts With' },
    { id: 'gt', label: 'Greater Than (>)' },
    { id: 'lt', label: 'Less Than (<)' },
    { id: 'gte', label: 'Greater or Equal (>=)' },
    { id: 'lte', label: 'Less or Equal (<=)' },
  ];

  const addRule = () => {
    setFilters([...filters, { 
      id: Math.random().toString(36).substr(2, 9), 
      column: columns[0] || '', 
      operator: 'contains', 
      value: '' 
    }]);
  };

  const removeRule = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 no-export">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-200">
              <SlidersHorizontal className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Visual Filter Lab</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[280px]">{chartTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          {filters.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                <Filter className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2">No active constraints</h4>
              <p className="text-slate-500 max-w-[320px] mx-auto text-sm font-medium leading-relaxed">Refine your chart visualization by adding logical rules based on specific column values.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active Rules ({filters.length})</span>
                <button onClick={() => setFilters([])} className="text-[10px] font-black text-red-500 uppercase hover:underline">Flush All</button>
              </div>
              {filters.map((rule, i) => (
                <div key={rule.id} className="grid grid-cols-12 gap-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group relative shadow-sm">
                  <div className="col-span-12 md:col-span-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Column</p>
                    <select 
                      value={rule.column} 
                      onChange={e => updateRule(rule.id, { column: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Operator</p>
                    <select 
                      value={rule.operator} 
                      onChange={e => updateRule(rule.id, { operator: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      {operators.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Criterion</p>
                    <input 
                      type="text" 
                      value={rule.value} 
                      placeholder="Enter value..."
                      onChange={e => updateRule(rule.id, { value: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex items-end justify-center">
                    <button onClick={() => removeRule(rule.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mb-0.5">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <button 
            onClick={addRule}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <PlusCircle className="w-5 h-5 text-indigo-600" /> New Logic Rule
          </button>
          <div className="flex w-full md:w-auto gap-4">
             <button 
               onClick={onClose}
               className="flex-1 md:flex-none px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
             >
               Apply Filters
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RenderChartProps {
  chart: ChartConfig;
  index: number;
  colors: string[];
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (index: number) => void;
  overrideData?: DataRow[];
  externalZoom?: number;
  externalPan?: number;
  onZoomUpdate?: (zoom: number) => void;
  onPanUpdate?: (pan: number) => void;
  externalHiddenKeys?: Set<string>;
  onHiddenKeysUpdate?: (keys: Set<string>) => void;
}

const RenderChart: React.FC<RenderChartProps> = ({ 
  chart, 
  index, 
  colors,
  selectable = false,
  selected = false,
  onSelect,
  overrideData,
  externalZoom,
  externalPan,
  onZoomUpdate,
  onPanUpdate,
  externalHiddenKeys,
  onHiddenKeysUpdate
}) => {
  const { type, xAxis, yAxis, additionalKeys = [], data: originalData, title } = chart;
  const data = overrideData || originalData;
  const chartRef = useRef<HTMLDivElement>(null);
  
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localHiddenKeys, setLocalHiddenKeys] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [localZoomLevel, setLocalZoomLevel] = useState(1);
  const [localPanOffset, setLocalPanOffset] = useState(0); 
  const [filters, setFilters] = useState<FilterRule[]>([]);

  const hiddenKeys = externalHiddenKeys || localHiddenKeys;
  const setHiddenKeys = onHiddenKeysUpdate || setLocalHiddenKeys;

  const zoomLevel = externalZoom !== undefined ? externalZoom : localZoomLevel;
  const panOffset = externalPan !== undefined ? externalPan : localPanOffset;

  const setZoom = (val: number) => {
    if (onZoomUpdate) onZoomUpdate(val);
    else setLocalZoomLevel(val);
  };

  const setPan = (val: number) => {
    if (onPanUpdate) onPanUpdate(val);
    else setLocalPanOffset(val);
  };

  const dataColumns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;
    return data.filter(row => {
      return filters.every(rule => {
        const rowVal = row[rule.column];
        if (rowVal === undefined || rowVal === null) return false;
        
        const stringVal = String(rowVal).toLowerCase();
        const ruleVal = rule.value.toLowerCase();
        const numRowVal = Number(rowVal);
        const numRuleVal = Number(rule.value);

        switch (rule.operator) {
          case 'equals': return stringVal === ruleVal;
          case 'not_equals': return stringVal !== ruleVal;
          case 'contains': return stringVal.includes(ruleVal);
          case 'starts_with': return stringVal.startsWith(ruleVal);
          case 'gt': return !isNaN(numRowVal) && !isNaN(numRuleVal) && numRowVal > numRuleVal;
          case 'lt': return !isNaN(numRowVal) && !isNaN(numRuleVal) && numRowVal < numRuleVal;
          case 'gte': return !isNaN(numRowVal) && !isNaN(numRuleVal) && numRowVal >= numRuleVal;
          case 'lte': return !isNaN(numRowVal) && !isNaN(numRuleVal) && numRowVal <= numRuleVal;
          default: return true;
        }
      });
    });
  }, [data, filters]);

  const displayLimit = 100;
  const zoomedData = useMemo(() => {
    if (type === 'scatter') return filteredData;
    
    let baseData = filteredData;
    if (zoomLevel <= 1) {
      return baseData.slice(0, displayLimit);
    }
    
    const sliceSize = Math.max(2, Math.floor(baseData.length / zoomLevel));
    const maxStart = baseData.length - sliceSize;
    const start = Math.round(maxStart * panOffset);
    return baseData.slice(start, start + sliceSize);
  }, [filteredData, zoomLevel, panOffset, type]);

  const handleLegendClick = (o: any) => {
    const key = o.dataKey || o.value;
    const next = new Set(hiddenKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHiddenKeys(next);
  };

  const renderLegendValue = (value: string) => {
    const isHidden = hiddenKeys.has(value);
    return (
      <span className={`text-[10px] font-bold transition-all duration-300 ${
        isHidden ? 'opacity-40 line-through text-slate-400' : 'opacity-100 text-slate-600'
      }`}>
        {value}
      </span>
    );
  };

  const isVisible = (key: string) => !hiddenKeys.has(key);

  const exportChart = async (format: 'png' | 'svg', scale: number) => {
    if (!chartRef.current) return;
    setIsCapturing(true);
    try {
      const options = { backgroundColor: '#ffffff', pixelRatio: format === 'svg' ? 1 : scale, cacheBust: true, style: { padding: '20px', borderRadius: '24px' } };
      const dataUrl = format === 'png' ? await toPng(chartRef.current, options) : await toSvg(chartRef.current, options);
      const link = document.createElement('a');
      link.download = `${slugify(title)}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); } 
    finally { setIsCapturing(false); setShowExportOptions(false); }
  };

  const allSeriesKeys = useMemo(() => [yAxis, ...additionalKeys], [yAxis, additionalKeys]);
  const axisStyle = { fill: '#64748b', fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif' };

  return (
    <div 
      ref={chartRef} 
      className={`bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col h-full relative border-slate-100 shadow-sm ${
        selected ? 'ring-4 ring-indigo-500/20 border-indigo-200' : ''
      } ${selectable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
      onClick={() => selectable && onSelect && onSelect(index)}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-base font-black text-slate-900 truncate tracking-tight pr-4">{title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-1 w-8 bg-indigo-500 rounded-full opacity-50" />
            {filters.length > 0 && (
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <Check className="w-2.5 h-2.5" /> Lab Active ({filters.length})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 relative no-export">
          {!selectable && (
            <>
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mr-1 p-0.5 shadow-inner">
                <button 
                  onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoomLevel + 0.5, 5)); }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                  disabled={zoomLevel >= 5}
                ><ZoomIn className="w-4 h-4" /></button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setZoom(Math.max(zoomLevel - 0.5, 1)); }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                  disabled={zoomLevel <= 1}
                ><ZoomOut className="w-4 h-4" /></button>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setShowFilterModal(true); }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-wider ${filters.length > 0 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200'}`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setShowExportOptions(!showExportOptions); }} 
                className={`p-2.5 rounded-2xl transition-all border ${showExportOptions ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 hover:text-indigo-600 border-slate-200 hover:bg-slate-50'}`}
              ><SettingsIcon className="w-4.5 h-4.5" /></button>
            </>
          )}
          {selectable && <div className={`p-2 rounded-2xl border transition-all ${selected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-300 border-slate-200'}`}><Check className="w-5 h-5" /></div>}
        </div>
      </div>

      <FilterModal 
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        columns={dataColumns}
        chartTitle={title}
      />

      {showExportOptions && (
        <div className="absolute top-16 right-8 w-52 bg-white shadow-2xl border border-slate-100 p-4 rounded-3xl z-50 no-export animate-in slide-in-from-top-4 duration-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Export Lab</p>
          <div className="space-y-1">
            <button onClick={() => exportChart('png', 2)} className="w-full text-left p-3 hover:bg-indigo-50 hover:text-indigo-700 rounded-2xl text-[11px] font-bold flex items-center gap-3 transition-colors"><ImageIcon className="w-4 h-4" /> Snapshot PNG</button>
            <button onClick={() => exportChart('svg', 1)} className="w-full text-left p-3 hover:bg-indigo-50 hover:text-indigo-700 rounded-2xl text-[11px] font-bold flex items-center gap-3 transition-colors"><FileCode className="w-4 h-4" /> Vector SVG</button>
          </div>
        </div>
      )}

      <div className="h-[260px] w-full mt-auto relative">
        {zoomedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
               <FilterIcon className="w-8 h-8 opacity-20" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Filter Matches</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={zoomedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey={xAxis} axisLine={false} tickLine={false} tick={{ ...axisStyle }} dy={5} interval={0} hide={zoomLevel > 3} />
                <YAxis axisLine={false} tickLine={false} tick={{ ...axisStyle }} />
                <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  onClick={handleLegendClick}
                  formatter={renderLegendValue}
                  wrapperStyle={{ cursor: 'pointer', paddingBottom: '15px' }}
                />
                {allSeriesKeys.map((key, idx) => isVisible(key) && (
                  <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[6, 6, 0, 0]} />
                ))}
              </BarChart>
            ) : type === 'area' ? (
              <AreaChart data={zoomedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey={xAxis} axisLine={false} tickLine={false} tick={{ ...axisStyle }} dy={5} hide={zoomLevel > 3} />
                <YAxis axisLine={false} tickLine={false} tick={{ ...axisStyle }} />
                <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  onClick={handleLegendClick}
                  formatter={renderLegendValue}
                  wrapperStyle={{ cursor: 'pointer', paddingBottom: '15px' }}
                />
                {allSeriesKeys.map((key, idx) => isVisible(key) && (
                  <Area key={key} type="monotone" dataKey={key} stroke={colors[idx % colors.length]} fill={colors[idx % colors.length]} fillOpacity={0.25} strokeWidth={2.5} />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={zoomedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey={xAxis} axisLine={false} tickLine={false} tick={{ ...axisStyle }} dy={5} hide={zoomLevel > 3} />
                <YAxis axisLine={false} tickLine={false} tick={{ ...axisStyle }} />
                <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  onClick={handleLegendClick}
                  formatter={renderLegendValue}
                  wrapperStyle={{ cursor: 'pointer', paddingBottom: '15px' }}
                />
                {allSeriesKeys.map((key, idx) => isVisible(key) && (
                  <Line key={key} type="monotone" dataKey={key} stroke={colors[idx % colors.length]} strokeWidth={3} dot={zoomLevel < 3} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 no-export">
        {zoomLevel > 1 && zoomedData.length > 0 && (
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-2">
            <MoveHorizontal className="w-4 h-4 text-indigo-400" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.001" 
              value={panOffset} 
              onChange={(e) => setPan(parseFloat(e.target.value))} 
              className="flex-1 h-1.5 bg-indigo-100 rounded-full appearance-none cursor-grab active:cursor-grabbing accent-indigo-600"
            />
          </div>
        )}
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {filteredData.length.toLocaleString()} nodes scoped
          </span>
          {zoomLevel > 1 && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Zoom: {zoomLevel}x</span>}
        </div>
      </div>
    </div>
  );
};

interface DataTableProps {
  data: DataRow[];
  columns?: string[];
  title?: string;
  icon?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({ data, columns: overrideColumns, title = "Data Explorer", icon = <TableIcon className="w-6 h-6 text-indigo-600" /> }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const columns = useMemo(() => overrideColumns || Object.keys(data[0] || {}), [data, overrideColumns]);
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const sortedAndFilteredRows = useMemo(() => {
    let result = [...data];
    if (searchTerm) result = result.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key];
        if (aVal === bVal) return 0;
        const comp = (aVal < bVal) ? -1 : 1;
        return sortConfig.direction === 'asc' ? comp : -comp;
      });
    }
    return result;
  }, [data, searchTerm, sortConfig]);

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/40">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.25rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{sortedAndFilteredRows.length.toLocaleString()} indexed records</p>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="text" placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-2xl pl-14 pr-8 py-4 text-sm font-bold focus:ring-[12px] focus:ring-indigo-500/5 outline-none w-full md:w-80 transition-all shadow-sm" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              {columns.map(col => (
                <th key={col} onClick={() => handleSort(col)} className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">{col} <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig?.key === col ? 'text-indigo-600' : 'text-slate-300'}`} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedAndFilteredRows.slice(0, 50).map((row, i) => (
              <tr key={i} className="hover:bg-indigo-50/25 transition-colors group">
                {columns.map(col => <td key={col} className="px-10 py-5 text-sm text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{String(row[col] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PerformancePulse: React.FC<{ pulse: { strengths: string[]; risks: string[] } }> = ({ pulse }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="bg-gradient-to-br from-emerald-50 to-white p-10 rounded-[3rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Strengths</h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Optimized performance</p>
            </div>
          </div>
          <ArrowUpRight className="w-7 h-7 text-emerald-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </div>
        <div className="space-y-5">
          {pulse.strengths.map((s, i) => (
            <div key={i} className="flex gap-5 p-5 bg-white/70 border border-emerald-50/50 rounded-2xl shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-slate-600 font-bold leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-50 to-white p-10 rounded-[3rem] border border-rose-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Risks</h2>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Critical intervention</p>
            </div>
          </div>
          <TrendingDown className="w-7 h-7 text-rose-300 group-hover:translate-y-1 transition-transform" />
        </div>
        <div className="space-y-5">
          {pulse.risks.map((r, i) => (
            <div key={i} className="flex gap-5 p-5 bg-white/70 border border-rose-50/50 rounded-2xl shadow-sm">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-slate-600 font-bold leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DataCleaningLab: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onApply: (options: DataCleaningOptions) => void;
  data: DataRow[];
}> = ({ isOpen, onClose, onApply, data }) => {
  const [options, setOptions] = useState<DataCleaningOptions>({
    handleMissing: 'none',
    removeDuplicates: false,
    standardizeText: false
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 no-export">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-emerald-200">
              <Eraser className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Data Cleaning Lab</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimize dataset quality</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Handle Missing Values</p>
            <div className="grid grid-cols-1 gap-2">
              {(['none', 'drop', 'impute_mean', 'impute_zero'] as const).map((method) => (
                <button 
                  key={method} 
                  onClick={() => setOptions({ ...options, handleMissing: method })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    options.handleMissing === method ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm font-bold capitalize">{method.replace('_', ' ')}</span>
                  {options.handleMissing === method && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quality Controls</p>
            <div className="space-y-3">
              <button 
                onClick={() => setOptions({ ...options, removeDuplicates: !options.removeDuplicates })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  options.removeDuplicates ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3"><Layers className="w-5 h-5" /><span className="text-sm font-bold">Remove Duplicates</span></div>
                {options.removeDuplicates ? <Check className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />}
              </button>
              <button 
                onClick={() => setOptions({ ...options, standardizeText: !options.standardizeText })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  options.standardizeText ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3"><FileType className="w-5 h-5" /><span className="text-sm font-bold">Standardize Text (Trim)</span></div>
                {options.standardizeText ? <Check className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={() => onApply(options)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">Apply & Re-analyze</button>
        </div>
      </div>
    </div>
  );
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, reportName, data, onReanalyze }) => {
  const [charts] = useState<ChartConfig[]>(analysis.suggestedCharts);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [activePaletteKey, setActivePaletteKey] = useState<keyof typeof PALETTES>('default');
  const [showPaletteSelector, setShowPaletteSelector] = useState(false);
  const [showCleaningLab, setShowCleaningLab] = useState(false);
  const [isCapturingPdf, setIsCapturingPdf] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [syncZoom, setSyncZoom] = useState(1);
  const [syncPan, setSyncPan] = useState(0.5);
  const [globalHiddenKeys, setGlobalHiddenKeys] = useState<Set<string>>(new Set());

  const dashboardRef = useRef<HTMLDivElement>(null);
  const currentColors = useMemo(() => PALETTES[activePaletteKey].colors, [activePaletteKey]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(analysis.summary);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleApplyCleaning = (options: DataCleaningOptions) => {
    let cleaned = [...data];
    if (options.standardizeText) {
      cleaned = cleaned.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(k => {
          if (typeof row[k] === 'string') newRow[k] = row[k].trim();
          else newRow[k] = row[k];
        });
        return newRow;
      });
    }
    if (options.handleMissing === 'drop') {
      cleaned = cleaned.filter(row => !Object.values(row).some(v => v === null || v === undefined || v === ''));
    } else if (options.handleMissing !== 'none') {
      const cols = Object.keys(data[0] || {});
      cols.forEach(col => {
        const numericValues = data.map(r => r[col]).filter(v => typeof v === 'number') as number[];
        const isNumeric = numericValues.length > 0;
        if (options.handleMissing === 'impute_mean' && isNumeric) {
          const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          cleaned = cleaned.map(row => (row[col] === null || row[col] === undefined || row[col] === '') ? { ...row, [col]: mean } : row);
        } else if (options.handleMissing === 'impute_zero') {
          cleaned = cleaned.map(row => (row[col] === null || row[col] === undefined || row[col] === '') ? { ...row, [col]: 0 } : row);
        }
      });
    }
    if (options.removeDuplicates) {
      const seen = new Set();
      cleaned = cleaned.filter(row => {
        const str = JSON.stringify(row);
        if (seen.has(str)) return false;
        seen.add(str);
        return true;
      });
    }
    if (onReanalyze) {
      onReanalyze(cleaned, reportName, { model: 'pro', detailLevel: 'standard', features: { trendPrediction: true, anomalyDetection: true, correlationAnalysis: true, strategicForecasting: true } });
    }
    setShowCleaningLab(false);
  };

  const exportMarkdown = () => {
    const content = `# Report: ${reportName}\n\n## Executive Summary\n${analysis.summary}\n\n## Strategic Insights\n${analysis.insights.map(i => `- ${i}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(reportName)}-summary.md`;
    link.click();
  };

  const exportToPdf = async () => {
    if (!dashboardRef.current) return;
    setIsCapturingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const elementsToHide = dashboardRef.current.querySelectorAll('.no-export');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      const dataUrl = await toPng(dashboardRef.current, { backgroundColor: '#f8fafc', pixelRatio: 2 });
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`${slugify(reportName)}.pdf`);
    } catch (err) { console.error(err); } finally { setIsCapturingPdf(false); }
  };

  const gridClasses = useMemo(() => {
    const count = selectedIndices.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2'; // 2x2 is better for 4 charts
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // 5+ charts
  }, [selectedIndices.length]);

  return (
    <div className="pb-32 bg-slate-50 min-h-screen" ref={dashboardRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 no-export">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">{reportName}</h1>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Global Matrix Synchronization</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm flex gap-1.5">
             <button onClick={() => setShowPaletteSelector(!showPaletteSelector)} className={`p-3 rounded-2xl transition-all ${showPaletteSelector ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-indigo-600'}`}><Palette className="w-6 h-6" /></button>
             <button onClick={() => setShowCleaningLab(true)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><Eraser className="w-6 h-6 text-emerald-600" /></button>
             <button onClick={exportToPdf} disabled={isCapturingPdf} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><FileDown className="w-6 h-6 text-indigo-600" /></button>
             <button onClick={exportMarkdown} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><FileCode className="w-6 h-6 text-indigo-600" /></button>
          </div>

          {showPaletteSelector && (
            <div className="absolute top-full right-0 mt-5 w-80 bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-8 z-[500] animate-in slide-in-from-top-6 duration-300">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Color Architectures</h4>
               <div className="space-y-4">
                 {(Object.keys(PALETTES) as Array<keyof typeof PALETTES>).map((key) => (
                   <button key={key} onClick={() => { setActivePaletteKey(key); setShowPaletteSelector(false); }} className={`w-full text-left p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all ${activePaletteKey === key ? 'border-indigo-600 bg-indigo-50/10' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{PALETTES[key].name}</span>
                     <div className="flex gap-2">
                       {PALETTES[key].colors.map((color, idx) => (
                         <div key={idx} className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                       ))}
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          <button onClick={() => setIsCompareMode(!isCompareMode)} className={`px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border ${isCompareMode ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{isCompareMode ? 'Exit Mode' : 'Compare Lab'}</button>
          {showComparisonView && <button onClick={() => setShowComparisonView(false)} className="px-7 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider">Back to Matrix</button>}
        </div>
      </div>

      <DataCleaningLab isOpen={showCleaningLab} onClose={() => setShowCleaningLab(false)} onApply={handleApplyCleaning} data={data} />

      {!showComparisonView ? (
        <div className="space-y-20 animate-in fade-in duration-1000">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {analysis.statistics.map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm group">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight"><FileText className="text-indigo-600 w-7 h-7" /> Intelligence Briefing</h2>
                  <button onClick={handleCopySummary} className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${copySuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}>
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copySuccess ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">{analysis.summary}</p>
              </div>

              <PerformancePulse pulse={analysis.performancePulse} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {charts.map((chart, i) => (
                  <RenderChart 
                    key={i} 
                    chart={chart} 
                    index={i} 
                    colors={currentColors} 
                    selectable={isCompareMode} 
                    selected={selectedIndices.includes(i)} 
                    onSelect={(idx) => setSelectedIndices(prev => prev.includes(idx) ? prev.filter(p => p !== idx) : [...prev, idx])}
                    overrideData={data} 
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-10 no-export">
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] h-fit shadow-2xl relative overflow-hidden border border-slate-800">
                <Sparkles className="absolute -top-8 -right-8 w-40 h-40 opacity-[0.03] rotate-12" />
                <h3 className="text-xl font-black flex items-center gap-4 mb-10 tracking-tight"><Sparkles className="text-indigo-400 w-7 h-7" /> Tactical Insights</h3>
                <div className="space-y-8">
                  {analysis.insights.map((insight, i) => (
                    <div key={i} className="flex gap-5 group">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2.5 flex-shrink-0 transition-all" />
                      <p className="text-base text-slate-400 font-medium leading-relaxed group-hover:text-white transition-colors duration-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DataTable data={data} />
        </div>
      ) : (
        <div className="space-y-12">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between sticky top-8 z-[200] max-w-6xl mx-auto border border-indigo-100 no-export gap-6">
            <div className="flex items-center gap-6 px-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100"><Layers className="text-white w-6 h-6" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-Matrix Comparison</p>
                <div className="flex items-center gap-2">
                   <p className="text-lg font-black text-slate-900 tracking-tight">{selectedIndices.length} Synthesized</p>
                   <button onClick={() => setShowComparisonView(false)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Add More</button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 md:pr-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precision Zoom</span>
                <div className="flex items-center bg-slate-100 rounded-2xl overflow-hidden p-1 shadow-inner">
                  <button onClick={() => setSyncZoom(Math.max(1, syncZoom - 0.5))} className="p-2 hover:bg-white rounded-xl transition-all"><ZoomOut className="w-4 h-4" /></button>
                  <span className="px-3 text-xs font-black text-slate-900 min-w-[24px] text-center">{syncZoom}x</span>
                  <button onClick={() => setSyncZoom(Math.min(5, syncZoom + 0.5))} className="p-2 hover:bg-white rounded-xl transition-all"><ZoomIn className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-[140px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offset</span>
                <input type="range" min="0" max="1" step="0.001" value={syncPan} onChange={(e) => setSyncPan(parseFloat(e.target.value))} className="w-full h-1.5 bg-indigo-100 rounded-full appearance-none accent-indigo-600 cursor-pointer" />
              </div>
              <div className="h-8 w-px bg-slate-100 mx-2" />
              <div className="flex items-center gap-2">
                <button onClick={() => { setSyncZoom(1); setSyncPan(0.5); setGlobalHiddenKeys(new Set()); }} className="p-3 bg-slate-100 rounded-2xl hover:bg-white border border-slate-200 transition-all text-slate-600" title="Reset Sync"><RotateCcw className="w-5 h-5" /></button>
                <button onClick={() => { setSelectedIndices([]); setShowComparisonView(false); }} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 border border-red-100 transition-all" title="Clear Comparison"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
          
          <div className={`grid gap-10 transition-all duration-500 ${gridClasses}`}>
            {selectedIndices.map(idx => charts[idx]).map((chart, i) => (
              <div key={i} className="animate-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <RenderChart 
                  chart={chart} 
                  index={i} 
                  colors={currentColors} 
                  overrideData={data} 
                  externalZoom={syncZoom} 
                  externalPan={syncPan} 
                  onZoomUpdate={setSyncZoom} 
                  onPanUpdate={setSyncPan}
                  externalHiddenKeys={globalHiddenKeys}
                  onHiddenKeysUpdate={setGlobalHiddenKeys}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isCompareMode && !showComparisonView && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[250] animate-in slide-in-from-bottom-12 no-export w-full max-w-lg px-6">
          <div className="bg-slate-900/95 backdrop-blur-2xl text-white px-10 py-6 rounded-[3rem] shadow-2xl flex items-center justify-between gap-8 border border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Synthesis Selection</span>
              <span className="text-base font-black tracking-tight">{selectedIndices.length} Elements Scoped</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedIndices([])} className="px-6 py-3 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Flush</button>
              <button disabled={selectedIndices.length < 1} onClick={() => setShowComparisonView(true)} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/30">Synergize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
