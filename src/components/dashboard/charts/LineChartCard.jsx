import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getrevenuedetails } from "../../../../api";

export const LineChartCard = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getrevenuedetails();
        
        // Transform the API data to match the Chart format
        // Expected API: [{ week_no: 1, revenue: 100 }, ...]
        const formattedData = result.map((item) => ({
          name: `Week ${item.week_no}`,
          revenue: parseFloat(item.revenue),
          attendance: 0, // Defaulting to 0 as API currently only sends revenue
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="h-[450px] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading performance trends...</p>
      </Card>
    );
  }

  return (
 <Card className="chart-container overflow-hidden border-none shadow-2xl bg-slate-50/50 w-full max-w-4xl mx-auto">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-xl font-bold text-slate-800">Performance Trends</CardTitle>
        <CardDescription>Weekly revenue for the current month</CardDescription>
      </CardHeader>

      <CardContent className="pt-4 px-6 pb-10">
        {/* 3D Perspective Wrapper */}
        <div className="relative" style={{ perspective: '1200px' }}>
          
          {/* THE CHART AREA (Floating) */}
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#e2e8f0" 
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />

                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                
                <Legend verticalAlign="top" height={36} iconType="circle" />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  dot={{ r: 4, fill: "white", strokeWidth: 2, stroke: "#3b82f6" }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                />

                {/* <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={{ r: 4, fill: "white", strokeWidth: 2, stroke: "#10b981" }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                /> */}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 3D BASE / FLOOR PLATE */}
          <div 
            className="absolute bottom-[-10px] left-[2%] right-[2%] h-[80px] bg-white/40"
            style={{
              transform: 'rotateX(70deg)',
              transformOrigin: 'bottom',
              borderRadius: '24px',
              zIndex: 0,
              boxShadow: '0 20px 40px rgba(0,0,0,0.08), inset 0 0 20px rgba(255,255,255,0.5)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};