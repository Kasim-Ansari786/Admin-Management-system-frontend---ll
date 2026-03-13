import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
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
   <Card className="chart-container overflow-hidden border-none bg-slate-50 shadow-lg">
      <CardHeader className="items-center pb-0 pt-6">
        <CardTitle className="text-xl font-bold text-slate-800">
          Student Status
        </CardTitle>
        <CardDescription>
          Current distribution of student accounts
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <div className="relative mx-auto aspect-square max-h-[350px] w-full flex items-center justify-center">
          
          {/* 3D PERSPECTIVE WRAPPER */}
          <div className="relative z-10 w-full h-full [perspective:1000px]">
            {loading ? (
              <div className="flex flex-col h-full items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A9CFF]" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            ) : chartData?.length > 0 ? (
              <div className="w-full h-full transition-transform duration-500 hover:rotate-x-12 [transform:rotateX(25deg)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* SVG FILTER FOR DEPTH/SHADOW */}
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="6" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        borderRadius: "7px",
                        border: "none",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    
                    <Pie
                      data={chartData.map((entry) => ({
                        ...entry,
                        color: entry.name.toLowerCase() === "active" ? "#1A9CFF" : entry.color,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={77}
                      outerRadius={90}
                      strokeWidth={2}
                      stroke="#ffffff"
                      paddingAngle={5}
                      animationBegin={0}
                      animationDuration={1500}
                      /* Apply the depth filter here */
                      style={{ filter: "url(#shadow)" }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name.toLowerCase() === "active" ? "#1A9CFF" : entry.color}
                          className="hover:opacity-90 transition-all cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
