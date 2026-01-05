
export interface DataRow {
  [key: string]: any;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  suggestedCharts: ChartConfig[];
  statistics: {
    label: string;
    value: string | number;
  }[];
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  xAxis: string;
  yAxis: string;
  data: any[];
}

export type AppView = 'dashboard' | 'upload' | 'analysis' | 'billing' | 'history';

export interface Report {
  id: string;
  name: string;
  date: string;
  analysis: AnalysisResult;
  data: DataRow[];
}
