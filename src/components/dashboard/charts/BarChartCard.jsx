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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchBarChartData } from "../../../../api";

export const BarChartCard = ({ data: propData }) => {
  const [data, setData] = useState(Array.isArray(propData) ? propData : []);
  const [loading, setLoading] = useState(propData ? false : true);

// Inside BarChartCard.jsx
useEffect(() => {
  let isMounted = true;

  const getData = async () => {
    try {
      setLoading(true);
      const result = await fetchBarChartData();
      if (isMounted) {
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error fetching bar chart data:", error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  if (Array.isArray(propData) && propData.length > 0) {
    setData(propData);
    setLoading(false);
  } else {
    getData();
  }

  return () => { isMounted = false; };
}, [propData]);

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  console.debug('BarChart data:', data);

  return (
    <Card className="chart-container overflow-hidden border-none shadow-xl bg-slate-50">
      <CardHeader className="p-6 mb-2">
        <CardTitle className="text-2xl font-bold text-slate-800">
          Monthly Overview
        </CardTitle>
        <CardDescription className="text-lg text-slate-500">
          Students and coaches registered per month
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="relative perspective-1000">
          <div className="h-[400px] w-full relative z-10">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400 italic">
                Loading data...
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 italic">
                <div>No chart data available</div>
                <pre className="mt-3 max-h-40 overflow-auto text-xs bg-white p-2 rounded border">{JSON.stringify(data, null, 2)}</pre>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={8} 
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F1F5F9" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />

                  {/* Setting iconType="circle" fixes the legend boxes to circles */}
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{
                      paddingBottom: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />

                  <Bar
                    dataKey="players"
                    name="Students"
                    fill="#1A9CFF"
                    radius={[50, 50, 0, 0]}
                    barSize={20}
                  />

                  <Bar
                    dataKey="coaches"
                    name="Teachers"
                    fill="#0c61d0ff" 
                    radius={[50, 50, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        
          <div
            className="absolute bottom-[-10px] left-0 right-0 h-[40px] bg-slate-200"
            style={{
              transform: "rotateX(60deg)",
              transformOrigin: "bottom",
              filter: "blur(1px)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              zIndex: 0,
              borderRadius: "4px",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
