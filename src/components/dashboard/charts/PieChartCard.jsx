import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Optional: for a nice spinner
import { fetchPieChartData } from "../../../../api";

export const PieChartCard = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const data = await fetchPieChartData();
      setChartData(data);
      setLoading(false);
    };
    getData();
  }, []);

  return (
   <Card className="chart-container overflow-hidden border-none shadow-xl bg-slate-50">
      <CardHeader className="items-center pb-0 pt-6">
        <CardTitle className="text-xl font-bold text-slate-800">Player Status</CardTitle>
        <CardDescription>Current distribution of player accounts</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 p-6">
        {/* 3D Perspective Wrapper */}
        <div className="relative mx-auto aspect-square max-h-[300px] w-full flex items-center justify-center">
          
          {/* THE 3D BASE (Floor shadow) */}
          <div 
            className="absolute bottom-12 w-[70%] h-[20%] bg-slate-200/50 rounded-[100%]"
            style={{
              transform: 'rotateX(75deg)',
              filter: 'blur(8px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              zIndex: 0
            }}
          />

          {/* THE CHART */}
          <div className="relative z-10 w-full h-full">
            {loading ? (
              <div className="flex flex-col h-full items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85} // Slightly larger to pop
                    strokeWidth={5}
                    stroke="#ffffff" // Adds separation between slices
                    paddingAngle={8}
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">No player data available.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};