
import { useEffect, useState } from "react";
import { customRpcs } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CountryViewsDisplay from "@/components/admin/CountryViewsDisplay";

const AnalyticsSection = () => {
  const [countryData, setCountryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let startDate;
        
        if (timeRange === "7d") {
          startDate = format(subMonths(new Date(), 0.25), "yyyy-MM-dd");
        } else if (timeRange === "30d") {
          startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd");
        } else if (timeRange === "90d") {
          startDate = format(subMonths(new Date(), 3), "yyyy-MM-dd");
        } else {
          startDate = undefined;
        }
        
        const endDate = format(new Date(), "yyyy-MM-dd");
        
        const { data, error } = await customRpcs.getViewsByCountry(
          startDate, 
          endDate
        );
        
        if (error) {
          console.error("Error fetching country data:", error);
          return;
        }
        
        setCountryData(data || []);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Country Analytics Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${format(new Date(), "PPP")}`, 14, 30);
    doc.text(`Time range: ${timeRange === "all" ? "All time" : `Last ${timeRange}`}`, 14, 36);
    
    // Add table
    autoTable(doc, {
      head: [["Country", "Views", "Percentage (%)"]],
      body: countryData.map(item => [
        item.country || "Unknown",
        item.view_count,
        item.percentage.toFixed(2)
      ]),
      startY: 45,
    });
    
    // Save the PDF
    doc.save(`country-analytics-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <Tabs defaultValue="30d" className="w-full" onValueChange={(value) => setTimeRange(value as any)}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" onClick={exportPDF} disabled={loading}>
          <DownloadIcon className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      <TabsContent value="7d" className="mt-0">
        <CountryViewsDisplay data={countryData} loading={loading} />
      </TabsContent>
      <TabsContent value="30d" className="mt-0">
        <CountryViewsDisplay data={countryData} loading={loading} />
      </TabsContent>
      <TabsContent value="90d" className="mt-0">
        <CountryViewsDisplay data={countryData} loading={loading} />
      </TabsContent>
      <TabsContent value="all" className="mt-0">
        <CountryViewsDisplay data={countryData} loading={loading} />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsSection;
