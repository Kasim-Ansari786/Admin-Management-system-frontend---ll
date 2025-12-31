import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {fetchBarChartData} from "../../../../api";

export const BarChartCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        // Assuming fetchBarChartData returns the array of monthly data
        const result = await fetchBarChartData();
        setData(result);
      } catch (error) {
        console.error("Error fetching bar chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  return (
  <Card className="chart-container">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-bold text-slate-800">
          Monthly Overview
        </CardTitle>
        <CardDescription className="text-lg text-slate-500">
          Players and coaches registered per month
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[400px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400 italic">
              Loading data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 14 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 14 }}
                  domain={[0, 120]}
                  ticks={[0, 30, 60, 90, 120]}
                />

                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />

                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="square"
                  iconSize={18}
                  wrapperStyle={{ paddingTop: '30px' }}
                />

                <Bar
                  dataKey="players"
                  name="Players"
                  fill="#3b82f6" /* The blue from your image */
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                />

                <Bar
                  dataKey="coaches"
                  name="Coaches"
                  fill="#8b5cf6" /* The purple from your image */
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
