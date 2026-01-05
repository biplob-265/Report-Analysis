
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, 
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ZAxis,
  ReferenceArea
} from 'recharts';
import { 
  Download, Share2, FileText, ChevronRight, Filter, Sparkles, 
  Info, Image as ImageIcon, FileCode, FileType, ZoomIn, ZoomOut, RotateCcw,
  ExternalLink, Code, Link as LinkIcon, Check, GripVertical, FileJson, Columns, 
  Layers, X, CheckSquare, Square, Maximize2
} from 'lucide-react';
import { AnalysisResult, ChartConfig, DataRow } from '../types';
import { jsPDF } from 'jspdf';
import { toPng, toSvg } from 'html-to-image';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  reportName: string;
  data: DataRow[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#ef4444'];

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const CustomTooltip = ({ active, payload, label, xAxis, yAxis, type }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-sm pointer-events-none z-50">
        <p className="font-bold text-slate-900 mb-1">{payload[0].payload[xAxis] || label}</p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name || yAxis}:
              </span>
              <span className="font-mono font-medium text-slate-900">{item.value}</span>
            </div>
          ))}
          {type === 'scatter' && (
             <div className="pt-1 mt-1 border-t border-slate-50 text-[10px] text-slate-400">
               Individual Point Record
             </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface RenderChartProps {
  chart: ChartConfig;
  index: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  draggedIndex?: number | null;
  dragOverIndex?: number | null;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (index: number) => void;
  syncId?: string;
  isComparison?: boolean;
}

const RenderChart: React.FC<RenderChartProps> = ({ 
  chart, 
  index, 
  onDragStart, 
  onDragOver, 
  onDragLeave,
  onDrop, 
  draggedIndex,
  dragOverIndex,
  selectable = false,
  selected = false,
  onSelect,
  syncId,
  isComparison = false
}) => {
  const { type, xAxis, yAxis, category, additionalKeys = [], data, title } = chart;
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const chartId = useMemo(() => `chart-${slugify(title)}`, [title]);

  // Zoom State
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);
  const [left, setLeft] = useState<string | number>('dataMin');
  const [right, setRight] = useState<string | number>('dataMax');
  const [top, setTop] = useState<string | number>('auto');
  const [bottom, setBottom] = useState<string | number>('auto');

  const allSeriesKeys = useMemo(() => [yAxis, ...additionalKeys], [yAxis, additionalKeys]);

  const groupedData = useMemo(() => {
    if (!category) return { [title]: data };
    return data.reduce((acc, item) => {
      const cat = String(item[category] || 'Other');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [data, category, title]);

  const handleLegendClick = (o: any) => {
    const { dataKey, value } = o;
    const key = dataKey || value;
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isVisible = (key: string) => !hiddenKeys.has(key);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }
    let [newLeft, newRight] = [refAreaLeft, refAreaRight];
    if (newLeft! > newRight!) [newLeft, newRight] = [newRight, newLeft];
    setLeft(newLeft!);
    setRight(newRight!);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setTop('auto');
    setBottom('auto');
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const exportChart = async (format: 'png' | 'svg') => {
    if (!chartRef.current) return;
    try {
      const filter = (node: HTMLElement) => {
        const exclusionClasses = ['export-buttons', 'drag-handle', 'select-indicator'];
        return !exclusionClasses.some(cls => node.classList?.contains(cls));
      };
      let dataUrl;
      if (format === 'png') {
        dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff', filter });
      } else {
        dataUrl = await toSvg(chartRef.current, { filter });
      }
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export chart', err);
    }
  };

  const exportChartDataAsJson = () => {
    const jsonString = JSON.stringify(chart, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareChart = async () => {
    const url = new URL(window.location.href);
    url.hash = chartId;
    const shareUrl = url.toString();

    const shareData = {
      title: `Data Insight: ${title}`,
      text: `Check out this data visualization for ${title} generated by InsightStream AI.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Error sharing', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const exportInteractiveHtml = () => {
    const configString = JSON.stringify(chart);
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Interactive Data View</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
    </style>
</head>
<body class="p-4 md:p-12">
    <div id="root" class="max-w-5xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100"></div>
    <script>
        const { 
            ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, 
            PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
            Tooltip, Legend, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
        } = Recharts;
        const config = ${configString};
        const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#ef4444'];

        function App() {
            const renderChart = () => {
                const commonProps = { data: config.data, width: "100%", height: 400 };
                const grid = React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" });
                const xAxis = React.createElement(XAxis, { dataKey: config.xAxis, stroke: "#94a3b8", fontSize: 12 });
                const yAxis = React.createElement(YAxis, { stroke: "#94a3b8", fontSize: 12 });
                const tooltip = React.createElement(Tooltip, { 
                  contentStyle: { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } 
                });
                const legend = React.createElement(Legend);

                switch(config.type) {
                    case 'bar':
                        return React.createElement(BarChart, commonProps, grid, xAxis, yAxis, tooltip, legend, 
                            React.createElement(Bar, { dataKey: config.yAxis, fill: COLORS[0], radius: [4,4,0,0] }));
                    case 'line':
                        return React.createElement(LineChart, commonProps, grid, xAxis, yAxis, tooltip, legend, 
                            React.createElement(Line, { type: "monotone", dataKey: config.yAxis, stroke: COLORS[0], strokeWidth: 3 }));
                    case 'area':
                        return React.createElement(AreaChart, commonProps, grid, xAxis, yAxis, tooltip, legend, 
                            React.createElement(Area, { type: "monotone", dataKey: config.yAxis, fill: COLORS[0], stroke: COLORS[0], fillOpacity: 0.2 }));
                    case 'pie':
                        return React.createElement(PieChart, commonProps, tooltip, legend, 
                            React.createElement(Pie, { 
                                data: config.data, dataKey: config.yAxis, nameKey: config.xAxis, 
                                cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5 
                            }, config.data.map((_, i) => React.createElement(Cell, { key: i, fill: COLORS[i % COLORS.length] }))));
                    case 'scatter':
                        return React.createElement(ScatterChart, commonProps, grid, 
                            React.createElement(XAxis, { type: "number", dataKey: config.xAxis, stroke: "#94a3b8" }),
                            React.createElement(YAxis, { type: "number", dataKey: config.yAxis, stroke: "#94a3b8" }),
                            tooltip, legend, React.createElement(Scatter, { data: config.data, fill: COLORS[0] }));
                    case 'radar':
                        return React.createElement(RadarChart, { ...commonProps, outerRadius: 90 },
                            React.createElement(PolarGrid), React.createElement(PolarAngleAxis, { dataKey: config.xAxis }),
                            React.createElement(PolarRadiusAxis), tooltip, 
                            React.createElement(Radar, { dataKey: config.yAxis, stroke: COLORS[0], fill: COLORS[0], fillOpacity: 0.6 }));
                    default: 
                        return React.createElement('p', null, "Unsupported chart type");
                }
            };

            return React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center justify-between mb-8' },
                  React.createElement('div', null,
                    React.createElement('h2', { className: 'text-3xl font-bold text-slate-900' }, config.title),
                    React.createElement('p', { className: 'text-slate-500' }, 'Interactive report generated by InsightStream AI')
                  ),
                  React.createElement('div', { className: 'bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600 font-bold text-sm' }, 'Gemini 3 Powered')
                ),
                React.createElement('div', { style: { height: '400px' }, className: 'w-full' }, 
                    React.createElement(ResponsiveContainer, null, renderChart())
                ),
                React.createElement('div', { className: 'mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400' },
                  React.createElement('span', null, '© ' + new Date().getFullYear() + ' InsightStream AI'),
                  React.createElement('span', null, 'Standalone Interactive Export')
                )
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_interactive.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isZoomed = left !== 'dataMin' || right !== 'dataMax';
  const isDragging = draggedIndex === index;
  const isDragOver = dragOverIndex === index;

  return (
    <div 
      id={chartId}
      ref={chartRef} 
      draggable={!selectable}
      onDragStart={onDragStart ? (e) => onDragStart(e, index) : undefined}
      onDragOver={onDragOver ? (e) => onDragOver(e, index) : undefined}
      onDragLeave={onDragLeave}
      onDrop={onDrop ? (e) => onDrop(e, index) : undefined}
      onClick={() => selectable && onSelect && onSelect(index)}
      className={`bg-white p-6 rounded-2xl border transition-all duration-300 group flex flex-col h-full relative target:ring-2 target:ring-indigo-500 target:ring-offset-4 animate-in fade-in ${
        isDragging ? 'opacity-20 scale-95 border-indigo-200' : 'border-slate-100 shadow-sm hover:shadow-md'
      } ${
        isDragOver && !isDragging ? 'border-indigo-500 border-2 bg-indigo-50/20 translate-y-1' : ''
      } ${
        selectable ? 'cursor-pointer' : ''
      } ${
        selected ? 'ring-2 ring-indigo-500 bg-indigo-50/10 border-indigo-200 shadow-lg shadow-indigo-100' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {selectable ? (
             <div className="select-indicator p-1 -ml-2">
               {selected ? (
                 <CheckSquare className="w-6 h-6 text-indigo-600 fill-indigo-50" />
               ) : (
                 <Square className="w-6 h-6 text-slate-300" />
               )}
             </div>
          ) : (
            !isComparison && (
              <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 p-1 -ml-2 rounded transition-colors group-hover:opacity-100 opacity-40">
                <GripVertical className="w-5 h-5" />
              </div>
            )
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className={`${isComparison ? 'text-md' : 'text-lg'} font-bold text-slate-900 line-clamp-1`}>{title}</h3>
              <div className="group/info relative">
                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-10">
                  Click legend to filter. {type !== 'pie' && type !== 'radar' && 'Drag area to zoom.'}
                </div>
              </div>
            </div>
            {isZoomed && (
               <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    <ZoomIn className="w-2.5 h-2.5" /> Viewing {left} — {right}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight"
                  >
                    Reset
                  </button>
               </div>
            )}
          </div>
        </div>
        
        {!selectable && (
          <div className="flex items-center gap-2 export-buttons">
            <div className="flex bg-slate-50 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {isZoomed && (
                <button 
                  onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                  className="p-1.5 hover:bg-white rounded-md transition-colors text-indigo-600"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); shareChart(); }}
                className={`p-1.5 relative hover:bg-white rounded-md transition-all ${copyFeedback ? 'text-green-600 bg-white scale-110 shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                title="Share deep link"
              >
                {copyFeedback ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copyFeedback && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
                    Link Copied!
                  </span>
                )}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); exportChartDataAsJson(); }}
                className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-indigo-600"
                title="Export Chart Data (JSON)"
              >
                <FileJson className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); exportInteractiveHtml(); }}
                className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-indigo-600"
                title="Export as Interactive HTML"
              >
                <Code className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); exportChart('png'); }}
                className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-indigo-600"
                title="Save as PNG"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`h-[${isComparison ? '240px' : '320px'}] w-full mt-auto select-none pointer-events-auto relative`} onDoubleClick={(e) => { e.stopPropagation(); zoomOut(); }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart 
              data={data}
              syncId={syncId}
              onMouseDown={(e: any) => !selectable && e && setRefAreaLeft(e.activeLabel)}
              onMouseMove={(e: any) => !selectable && e && refAreaLeft && setRefAreaRight(e.activeLabel)}
              onMouseUp={!selectable ? zoom : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxis} domain={[left, right]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[bottom, top]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
              {allSeriesKeys.map((key, idx) => isVisible(key) && (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.1} />
              )}
            </BarChart>
          ) : type === 'line' ? (
            <LineChart 
              data={data}
              syncId={syncId}
              onMouseDown={(e: any) => !selectable && e && setRefAreaLeft(e.activeLabel)}
              onMouseMove={(e: any) => !selectable && e && refAreaLeft && setRefAreaRight(e.activeLabel)}
              onMouseUp={!selectable ? zoom : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxis} domain={[left, right]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[bottom, top]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
              {allSeriesKeys.map((key, idx) => isVisible(key) && (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 2, stroke: '#fff' }} />
              ))}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.1} />
              )}
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart 
              data={data}
              syncId={syncId}
              onMouseDown={(e: any) => !selectable && e && setRefAreaLeft(e.activeLabel)}
              onMouseMove={(e: any) => !selectable && e && refAreaLeft && setRefAreaRight(e.activeLabel)}
              onMouseUp={!selectable ? zoom : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxis} domain={[left, right]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[bottom, top]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
              {allSeriesKeys.map((key, idx) => isVisible(key) && (
                <Area key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.1} />
              ))}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.1} />
              )}
            </AreaChart>
          ) : type === 'scatter' ? (
            <ScatterChart 
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              syncId={syncId}
              onMouseDown={(e: any) => !selectable && e && setRefAreaLeft(e.xValue)}
              onMouseMove={(e: any) => !selectable && e && refAreaLeft && setRefAreaRight(e.xValue)}
              onMouseUp={!selectable ? zoom : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey={xAxis} domain={[left, right]} name={xAxis} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey={yAxis} domain={[bottom, top]} name={yAxis} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <ZAxis range={[64, 400]} />
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} type="scatter" />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
              {Object.entries(groupedData).map(([name, groupData], idx) => isVisible(name) && (
                <Scatter key={name} name={name} data={groupData} fill={COLORS[idx % COLORS.length]} line={false} shape="circle" />
              ))}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.1} />
              )}
            </ScatterChart>
          ) : type === 'radar' ? (
            <RadarChart outerRadius={90} data={data}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey={xAxis} stroke="#94a3b8" fontSize={10} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" fontSize={10} />
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
              {Object.keys(groupedData).map((name, idx) => isVisible(name) && (
                <Radar key={name} name={name} dataKey={yAxis} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.6} />
              ))}
            </RadarChart>
          ) : (
            <PieChart>
              <Pie
                data={data.filter(d => isVisible(String(d[xAxis])))}
                dataKey={yAxis}
                nameKey={xAxis}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {!selectable && (
        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
           <span className="flex items-center gap-1 font-medium text-indigo-500/80"><Filter className="w-3 h-3" /> Click legend to toggle series</span>
           {type !== 'pie' && type !== 'radar' && (
             <span className="flex items-center gap-1 font-medium text-slate-400"><ZoomIn className="w-3 h-3" /> Drag chart area to zoom</span>
           )}
        </div>
      )}
    </div>
  );
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, reportName, data }) => {
  const [charts, setCharts] = useState<ChartConfig[]>(analysis.suggestedCharts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);

  useEffect(() => {
    setCharts(analysis.suggestedCharts);
  }, [analysis.suggestedCharts]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    const ghost = new Image();
    ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(ghost, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const newCharts = [...charts];
    const [removed] = newCharts.splice(draggedIndex, 1);
    newCharts.splice(dropIndex, 0, removed);
    
    setCharts(newCharts);
    handleDragEnd();
  };

  const handleSelectChart = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cellValue = row[header];
          if (cellValue === null || cellValue === undefined) cellValue = '';
          const stringified = String(cellValue);
          if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        }).join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${reportName.replace(/\s+/g, '_')}_raw_data.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDFReport = () => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 30;
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('InsightStream AI Report', margin, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(reportName, margin, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleString()} | Powered by Gemini 3`, margin, yPos);
    yPos += 15;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, yPos, 190, yPos);
    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(analysis.summary, 170);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 7 + 15;
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Key Dataset Statistics', margin, yPos);
    yPos += 10;
    analysis.statistics.forEach(stat => {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label, margin, yPos);
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(String(stat.value), margin + 80, yPos);
      yPos += 8;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
    });
    yPos += 12;
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Strategic Insights & Findings', margin, yPos);
    yPos += 10;
    analysis.insights.forEach((insight, idx) => {
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const insightLines = doc.splitTextToSize(`• ${insight}`, 170);
      doc.text(insightLines, margin, yPos);
      yPos += insightLines.length * 7 + 5;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
    });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential AI Analysis Report', margin, 285);
    doc.save(`${reportName.replace(/\s+/g, '_')}_AI_Report.pdf`);
  };

  const comparedCharts = useMemo(() => {
    return selectedIndices.map(idx => charts[idx]);
  }, [selectedIndices, charts]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{reportName}</h1>
          <p className="text-slate-500">AI-generated report based on your data</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`flex items-center gap-2 px-4 py-2 transition-colors border-r border-slate-100 font-medium ${isCompareMode ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Columns className="w-4 h-4" />
              {isCompareMode ? 'Exit Compare' : 'Compare Mode'}
            </button>
            <button 
              onClick={downloadPDFReport}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100"
            >
              <FileType className="w-4 h-4 text-red-500" />
              PDF Report
            </button>
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-green-500" />
              Raw CSV
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 font-medium">
            <Share2 className="w-4 h-4" />
            Share Report
          </button>
        </div>
      </div>

      {showComparisonView ? (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl border border-indigo-800 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Columns className="w-64 h-64 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div>
                     <h2 className="text-3xl font-bold">Comparative Analysis</h2>
                     <p className="text-indigo-200">Synchronized view of {selectedIndices.length} key metrics</p>
                   </div>
                   <button 
                    onClick={() => setShowComparisonView(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2"
                   >
                     <X className="w-5 h-5" />
                     Return to Dashboard
                   </button>
                </div>

                <div className={`grid grid-cols-1 ${selectedIndices.length > 1 ? (selectedIndices.length === 2 ? 'md:grid-cols-2' : 'lg:grid-cols-3') : ''} gap-6`}>
                   {comparedCharts.map((chart, i) => (
                     <div key={i} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                        <RenderChart 
                          chart={chart} 
                          index={i} 
                          syncId="comparisonSync"
                          isComparison={true}
                        />
                     </div>
                   ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-indigo-200">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Sync Interactions Enabled
                   </div>
                   <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Hover to cross-reference
                   </div>
                </div>
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analysis.statistics.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors group">
                <p className="text-sm text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-indigo-600 w-5 h-5" />
                    Executive Summary
                  </h2>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {analysis.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" onDragEnd={handleDragEnd}>
                {charts.map((chart, i) => (
                  <RenderChart 
                    key={`${chart.title}-${i}`} 
                    chart={chart} 
                    index={i}
                    onDragStart={isCompareMode ? undefined : handleDragStart}
                    onDragOver={isCompareMode ? undefined : handleDragOver}
                    onDragLeave={isCompareMode ? undefined : handleDragLeave}
                    onDrop={isCompareMode ? undefined : handleDrop}
                    draggedIndex={draggedIndex}
                    dragOverIndex={dragOverIndex}
                    selectable={isCompareMode}
                    selected={selectedIndices.includes(i)}
                    onSelect={handleSelectChart}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 border border-indigo-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Strategic Findings
                  </h3>
                  <button 
                    onClick={downloadPDFReport}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-indigo-300 hover:text-white"
                    title="Export Insights to PDF"
                  >
                    <FileType className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-4">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      <p className="text-sm text-indigo-100 leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-8">
                <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => { setIsCompareMode(true); setSelectedIndices([]); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-colors group"
                  >
                    Compare specific charts
                    <Columns className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-colors group">
                    Predict future values
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={downloadCSV}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-colors group"
                  >
                    Export raw dataset
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={downloadPDFReport}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left text-sm text-indigo-600 font-medium transition-colors group"
                  >
                    Generate Professional PDF
                    <FileType className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Comparison Tray */}
      {isCompareMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-20 duration-500">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Compare Mode</span>
               <span className="text-sm font-bold">
                 {selectedIndices.length === 0 
                   ? 'Select at least 2 charts' 
                   : `${selectedIndices.length} chart${selectedIndices.length === 1 ? '' : 's'} selected`}
               </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-3">
               <button 
                onClick={() => { setIsCompareMode(false); setSelectedIndices([]); }}
                className="px-4 py-2 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
               >
                 Cancel
               </button>
               <button 
                disabled={selectedIndices.length < 2}
                onClick={() => setShowComparisonView(true)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
               >
                 <Columns className="w-4 h-4" />
                 Analyze Side-by-Side
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
