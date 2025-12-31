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
<Card className="chart-container overflow-hidden border-none shadow-xl bg-slate-50">
      <CardHeader className="p-6 mb-2">
        <CardTitle className="text-2xl font-bold text-slate-800">
          Monthly Overview
        </CardTitle>
        <CardDescription className="text-lg text-slate-500">
          Players and coaches registered per month
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* The 3D Stage Wrapper */}
        <div className="relative perspective-1000">
          
          {/* The Chart Area */}
          <div className="h-[400px] w-full relative z-10">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400 italic">
                Loading data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
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
                    cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
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
                    wrapperStyle={{ paddingTop: '40px' }}
                  />
                  <Bar
                    dataKey="players"
                    name="Players"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={35}
                  />
                  <Bar
                    dataKey="coaches"
                    name="Coaches"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 3D BASE / FLOOR ELEMENT */}
          <div 
            className="absolute bottom-[-10px] left-0 right-0 h-[40px] bg-slate-200"
            style={{
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom',
              filter: 'blur(1px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              zIndex: 0,
              borderRadius: '4px'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
