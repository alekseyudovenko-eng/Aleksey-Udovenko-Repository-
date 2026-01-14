import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  Area,
  Legend,
} from 'recharts';
import type { MergedPriceData } from '../types';

interface PriceChartProps {
  data: MergedPriceData[];
  comparisonLabel?: string | null;
}

const CustomTooltip = ({ active, payload, label, comparisonLabel }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-lg text-sm">
        <p className="text-gray-600 font-semibold mb-2">{new Date(label).toLocaleDateString()}</p>
        <div className="font-mono text-gray-800 space-y-1">
          <p>O: <span className="font-bold">{data.open.toFixed(2)}</span> H: <span className="font-bold">{data.high.toFixed(2)}</span> L: <span className="font-bold">{data.low.toFixed(2)}</span></p>
          <p style={{ color: '#2962FF' }}>FCPO Close: <span className="font-bold">{data.close.toFixed(2)}</span></p>
          {data.comparisonClose != null && comparisonLabel && (
            <p style={{ color: '#EF5350' }}>{comparisonLabel} Close: <span className="font-bold">{data.comparisonClose.toFixed(2)}</span></p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, comparisonLabel }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const yDomainValues = data.reduce(
    (acc, { low, high, comparisonClose }) => {
      const values = [acc[0], acc[1], low, high];
      if (comparisonClose != null) {
        values.push(comparisonClose);
      }
      return [Math.min(...values), Math.max(...values)];
    },
    [data[0].low, data[0].high],
  );
  
  const domain = [
    yDomainValues[0] * 0.98,
    yDomainValues[1] * 1.02,
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#2962FF" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
        <XAxis
          dataKey="date"
          tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          stroke="#4B5563"
          tick={{ fontSize: 12 }}
          dy={10}
          type="category"
        />
        <YAxis
          domain={domain}
          orientation="right"
          stroke="#4B5563"
          tickFormatter={(tick) => tick.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          tick={{ fontSize: 12 }}
          dx={5}
          type="number"
        />
        <Tooltip content={<CustomTooltip comparisonLabel={comparisonLabel} />} cursor={{ stroke: '#2962FF', strokeWidth: 1, strokeDasharray: '3 3' }}/>
        <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingLeft: '50px', paddingTop: '10px' }}/>
        <Area 
            type="monotone" 
            dataKey="close" 
            stroke="none" 
            fill="url(#colorClose)" 
            isAnimationActive={false}
        />
        <Line
          name="FCPO"
          type="monotone"
          dataKey="close"
          stroke="#2962FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#2962FF' }}
          isAnimationActive={false}
        />
        {comparisonLabel && (
          <Line
            name={comparisonLabel}
            type="monotone"
            dataKey="comparisonClose"
            stroke="#EF5350"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#EF5350' }}
            isAnimationActive={false}
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
