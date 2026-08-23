import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function TrendComparisonChart({ data, areaName }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Observed Signals vs Risk Trajectory &mdash; {areaName}
          </h3>
          <p className="text-xs text-slate-500">
            Comparing demand against baseline (Left Axis) vs Risk Score (Right Axis)
          </p>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
            
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={12}
              domain={['auto', 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#e11d48"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="baseline"
              name="Seasonal Baseline"
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="medicine"
              name="Medicine Demand (Units)"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="fever"
              name="Fever Indicators"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="risk"
              name="Risk Score (%)"
              stroke="#e11d48"
              strokeWidth={3}
              dot={{ r: 5, fill: '#e11d48' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}