
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y';

export type ComparisonOption = 'NONE' | 'PREVIOUS_PERIOD' | 'SBO';

export type MergedPriceData = PriceData & {
  comparisonClose?: number;
};
