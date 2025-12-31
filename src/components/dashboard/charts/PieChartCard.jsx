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
    <Card className="chart-container">
      <CardHeader className="items-center pb-0">
        <CardTitle>Player Status</CardTitle>
        <CardDescription>Current distribution of player accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mx-auto aspect-square max-h-[300px] w-full flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(219, 43, 43, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                  paddingAngle={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">No player data available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};