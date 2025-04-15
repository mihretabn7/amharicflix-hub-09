import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStats from "@/components/AdminStats";
import CountryAnalytics from "@/components/admin/CountryAnalytics";
import UserActivityStats from "@/components/admin/UserActivityStats";
import ContentPerformance from "@/components/admin/ContentPerformance";
import { Printer, Download } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [exportFormat, setExportFormat] = useState<string>("csv");

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (exportFormat === "csv") {
      exportToCSV();
    } else if (exportFormat === "excel") {
      exportToExcel();
    } else if (exportFormat === "pdf") {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const data = getFilteredData();
    const csvContent = [
      Object.keys(data[0]).join(","), // Header row
      ...data.map((row) => Object.values(row).join(",")), // Data rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `analytics-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const data = getFilteredData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");
    XLSX.writeFile(workbook, `analytics-${timeRange}.xlsx`);
  };

  const exportToPDF = () => {
    const data = getFilteredData();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Analytics Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Time range: ${timeRange}`, 14, 30);
    autoTable(doc, {
      head: [Object.keys(data[0])],
      body: data.map((row) => Object.values(row)),
      startY: 40,
    });
    doc.save(`analytics-${timeRange}.pdf`);
  };

  const getFilteredData = () => {
    // Replace this with the actual data based on the selected filters
    // Example: Combine data from AdminStats, UserActivityStats, etc.
    return [
      { Metric: "Total Users", Value: 1234 },
      { Metric: "Total Movies", Value: 567 },
      { Metric: "Total Views", Value: 890 },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select
            value={exportFormat}
            onValueChange={setExportFormat}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user-activity">User Activity</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="location">Location Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <div className="flex justify-end mb-4">
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </div>
              
              <AdminStats timeRange={timeRange} />
            </Tabs>
          </div>
        </TabsContent>
        
        <TabsContent value="user-activity" className="space-y-4">
          <UserActivityStats timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <ContentPerformance timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="location" className="space-y-4">
          <CountryAnalytics timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Temporary toast implementation until proper import is added
const toast = {
  success: (message: string) => console.log(message),
  error: (message: string) => console.error(message)
};