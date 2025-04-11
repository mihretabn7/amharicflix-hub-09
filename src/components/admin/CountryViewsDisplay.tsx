
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface CountryViewsDisplayProps {
  data: any[];
  loading: boolean;
}

const COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
  "#FF9F40", "#8CD47E", "#EA526F", "#23B5D3", "#279AF1"
];

const CountryViewsDisplay = ({ data, loading }: CountryViewsDisplayProps) => {
  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="view_count"
                  nameKey="country"
                  label={({ country, percent }) => 
                    `${country || 'Unknown'}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} views`, 'Views']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Country</th>
                <th className="text-left py-2 px-4">Views</th>
                <th className="text-left py-2 px-4">%</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">{item.country || 'Unknown'}</td>
                  <td className="py-2 px-4">{item.view_count}</td>
                  <td className="py-2 px-4">{item.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export { CountryViewsDisplay };
