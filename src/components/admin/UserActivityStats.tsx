
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customRpcs } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FilePdf } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface UserActivityStatsProps {
  dateRange: DateRange;
}

export default function UserActivityStats({ dateRange }: UserActivityStatsProps) {
  const { toast } = useToast();
  const startDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString() : undefined;

  const { data: activityStats, isLoading, isError } = useQuery({
    queryKey: ['user-activity-stats', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      
      try {
        const { data, error } = await customRpcs.getUserActivityStats(startDate, endDate);
        
        if (error) {
          console.error("Error fetching user activity stats:", error);
          toast({
            title: "Error fetching activity data",
            description: error.message,
            variant: "destructive"
          });
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error("Error in activity stats query:", err);
        return [];
      }
    },
    enabled: !!startDate && !!endDate,
    refetchOnWindowFocus: false
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
    if (!formattedData.length) {
      toast({
        title: "No data to export",
        description: "Please select a date range with data.",
        variant: "destructive"
      });
      return;
    }

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
        toast({ title: "CSV export successful" });
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
        toast({ title: "Excel export successful" });
        break;
        
      case 'pdf':
        // Generate PDF using jsPDF
        try {
          generatePDF(formattedData);
          toast({ title: "PDF export successful" });
        } catch (error) {
          console.error("PDF generation error:", error);
          toast({ 
            title: "PDF export failed", 
            description: "Check console for details",
            variant: "destructive" 
          });
        }
        break;
    }
  };

  const generatePDF = (data: any[]) => {
    // @ts-ignore - jsPDF has types but they're not complete
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('User Activity Report', 14, 15);
    
    // Add date range
    doc.setFontSize(10);
    doc.text(`Report Period: ${dateRange.from?.toLocaleDateString()} to ${dateRange.to?.toLocaleDateString()}`, 14, 22);
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Summary', 14, 30);
    
    const totalViews = data.reduce((sum, item) => sum + item.views, 0);
    const totalRatings = data.reduce((sum, item) => sum + item.ratings, 0);
    const totalReports = data.reduce((sum, item) => sum + item.reports, 0);
    const maxDailyUsers = Math.max(...data.map(item => item.users));
    
    const summaryData = [
      ['Total Views', totalViews.toString()],
      ['Total Ratings', totalRatings.toString()],
      ['Total Reports', totalReports.toString()],
      ['Max Daily Users', maxDailyUsers.toString()]
    ];
    
    // @ts-ignore
    doc.autoTable({
      startY: 35,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 75, 250] }
    });
    
    // Add detailed data
    doc.setFontSize(12);
    // @ts-ignore
    doc.text('Daily Activity', 14, doc.autoTable.previous.finalY + 10);
    
    const tableData = data.map(item => [
      item.date,
      item.views,
      item.ratings,
      item.reports,
      item.users
    ]);
    
    // @ts-ignore
    doc.autoTable({
      // @ts-ignore
      startY: doc.autoTable.previous.finalY + 15,
      head: [['Date', 'Views', 'Ratings', 'Reports', 'Users']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [75, 75, 250] }
    });
    
    doc.save('user-activity-report.pdf');
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
        ) : isError ? (
          <div className="text-center py-8 text-muted-foreground">
            Error loading activity data. Please try again.
          </div>
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
