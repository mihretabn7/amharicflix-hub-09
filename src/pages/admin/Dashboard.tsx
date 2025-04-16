
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import AdminStats from "@/components/AdminStats";
import { Pencil, Clock, Eye, Film, AlertCircle, Star, User, Settings, Heart } from "lucide-react";
import { DonationsAndFeedbackSummary } from "@/components/admin/DonationsAndFeedbackSummary";

import UserActivityStats from "@/components/admin/UserActivityStats";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Tabs 
            value={timeRange} 
            onValueChange={(v: any) => setTimeRange(v)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <AdminStats timeRange={timeRange} />
      
      <UserActivityStats dateRange={dateRange} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonationsAndFeedbackSummary />
        
      </div>
    </div>
  );
}
