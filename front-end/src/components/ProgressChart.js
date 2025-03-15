// ProgressChart.js

import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ type, poolName, creditsEarned, totalCredits }) => {
  const data = [
    { name: 'Credits Earned', value: creditsEarned },
    { name: 'Remaining Credits', value: totalCredits ? totalCredits - creditsEarned : 0 },
  ].filter(d => d.value >= 0);

  if (type === 'pie') {
    const COLORS = ['#0088FE', '#00C49F'];
    return (
      <div className="chart-wrapper">
        <div className="chart-title">{poolName}</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={70} // Fixed comment syntax
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value} credits`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="chart-wrapper">
        <div className="chart-title">{poolName}</div>
        <ResponsiveContainer width="100%" height={30}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" domain={[0, totalCredits || creditsEarned]} hide={true} /> {/* Fixed hide prop */}
            <YAxis type="category" dataKey="name" hide={true} /> {/* Fixed hide prop */}
            <Bar dataKey="value" fill="#0088FE">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
            <Tooltip
              formatter={(value) => `${value} credits`}
              labelFormatter={() => ''}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="progress-text">
          {creditsEarned} / {totalCredits || '∞'} credits
        </div>
      </div>
    );
  }

  return null;
};

export default ProgressChart;