import type { Timeframe, ComparisonOption } from './types';

export const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y'];

export const COMPARISON_OPTIONS: { value: ComparisonOption; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'PREVIOUS_PERIOD', label: 'Previous Period' },
  { value: 'SBO', label: 'Soybean Oil' },
];
