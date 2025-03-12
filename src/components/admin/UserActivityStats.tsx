
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customRpcs } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FilePdf } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserActivityStatsProps {
  dateRange: DateRange;
}

export default function UserActivityStats({ dateRange }: UserActivityStatsProps) {
  const startDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString() : undefined;

  const { data: activityStats, isLoading } = useQuery({
    queryKey: ['user-activity-stats', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      
      const { data, error } = await customRpcs.getUserActivityStats(startDate, endDate);
      
      if (error) {
        console.error("Error fetching user activity stats:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!startDate && !!endDate,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formattedData = activityStats?.map((item: any) => ({
    date: formatDate(item.date_period),
    views: item.views_count,
    ratings: item.ratings_count,
    reports: item.reports_count,
    users: item.unique_users,
  })) || [];

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!formattedData.length) return;

    switch (format) {
      case 'csv':
        // Convert data to CSV
        const headers = ['Date', 'Views', 'Ratings', 'Reports', 'Unique Users'];
        const csvData = [
          headers.join(','),
          ...formattedData.map(item => 
            [item.date, item.views, item.ratings, item.reports, item.users].join(',')
          )
        ].join('\n');
        
        // Create and download file
        downloadFile(csvData, 'user-activity-stats.csv', 'text/csv');
        break;
        
      case 'excel':
        // For Excel, we'll create a simplified CSV that Excel can open
        const excelData = [
          headers.join('\t'),
          ...formattedData.map(item => 
            [item.date, item.views, item.ratings, item.reports, item.users].join('\t')
          )
        ].join('\n');
        
        downloadFile(excelData, 'user-activity-stats.xls', 'application/vnd.ms-excel');
        break;
        
      case 'pdf':
        // Alert for PDF (would normally use a library like jsPDF)
        alert('PDF export would be implemented with a PDF generation library');
        break;
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Activity Over Time</CardTitle>
          <CardDescription>
            Views, ratings, reports, and unique users over the selected period
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FilePdf className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">Loading activity data...</div>
        ) : formattedData.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#8884d8"
                  name="Views"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ratings"
                  stroke="#82ca9d"
                  name="Ratings"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="#ff7300"
                  name="Reports"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#0088fe"
                  name="Unique Users"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No activity data available for the selected date range
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {formattedData.length > 0 && (
            <>
              <div className="bg-accent/50 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Total Views</div>
                <div className="text-2xl font-bold">
                  {formattedData.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Total Ratings</div>
                <div className="text-2xl font-bold">
                  {formattedData.reduce((sum, item) => sum + item.ratings, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Total Reports</div>
                <div className="text-2xl font-bold">
                  {formattedData.reduce((sum, item) => sum + item.reports, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Max Daily Users</div>
                <div className="text-2xl font-bold">
                  {Math.max(...formattedData.map(item => item.users)).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
