import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

const ProgressChart = () => {
  // Hardcoded data for testing
  const coursePoolProgress = [
    { name: 'Core Courses', creditsEarned: 40, totalCredits: 69.5 },
    { name: 'Electives', creditsEarned: 10, totalCredits: 20 },
    { name: 'General Education', creditsEarned: 3, totalCredits: 3 },
  ];

  const totalCreditsData = [
    { name: 'Total Credits', value: 53, total: 120 }, // Hardcoded values
  ];

  // Colors for the pie chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div>
      {/* Pie Chart for Course Pool Progress */}
      <h3>Course Pool Progress</h3>
      <PieChart width={400} height={400}>
        <Pie
          data={coursePoolProgress}
          cx="50%"
          cy="50%"
          outerRadius={150}
          fill="#8884d8"
          dataKey="creditsEarned"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {coursePoolProgress.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      {/* Circle Bar for Total Credits */}
      <h3>Total Credits Progress</h3>
      <RadialBarChart
        width={400}
        height={300}
        innerRadius="20%"
        outerRadius="100%"
        data={totalCreditsData}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar minAngle={15} background dataKey="value" />
        <Tooltip />
        <Legend />
      </RadialBarChart>
    </div>
  );
};

export default ProgressChart;