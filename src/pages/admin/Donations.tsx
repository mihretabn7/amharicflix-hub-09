
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, subDays, isWithinInterval } from "date-fns";
import { formatDateTime } from "@/utils/date-utils";
import { toast } from "@/components/ui/use-toast";

export default function DonationsPage() {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const { data: donations, isLoading, refetch } = useQuery({
        queryKey: ["admin-donations"],
        queryFn: async () => {
            const { data, error } = await customRpcs.getAllDonationsWithUsers();
            
            if (error) {
                console.error("Error fetching donations:", error);
                toast({
                    title: "Error fetching donations",
                    description: error.message,
                    variant: "destructive",
                });
                return [];
            }
            
            return data || [];
        },
    });

    const handleStatusUpdate = async (donationId: string, newStatus: string) => {
        try {
            const { error } = await customRpcs.updateDonationStatus(
                donationId, 
                newStatus, 
                newStatus === "completed" ? new Date().toISOString() : null
            );
            
            if (error) throw error;
            
            toast({
                title: "Donation updated",
                description: `Status changed to ${newStatus}`,
            });
            
            refetch();
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const filteredDonations = donations?.filter(donation => {
        if (!dateRange.from || !dateRange.to) return true;
        
        const donationDate = new Date(donation.created_at);
        return isWithinInterval(donationDate, {
            start: dateRange.from,
            end: dateRange.to
        });
    });

    const totalAmount = filteredDonations?.reduce((sum, donation) => 
        sum + (donation.payment_status === "completed" ? donation.amount : 0), 0) || 0;
    
    const pendingAmount = filteredDonations?.reduce((sum, donation) => 
        sum + (donation.payment_status === "pending" ? donation.amount : 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold">Donations Management</h1>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                        <p className="text-sm text-muted-foreground">
                            {filteredDonations?.filter(d => d.payment_status === "completed").length || 0} completed donations
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
                        <p className="text-sm text-muted-foreground">
                            {filteredDonations?.filter(d => d.payment_status === "pending").length || 0} pending donations
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${filteredDonations?.length 
                                ? (filteredDonations.reduce((sum, d) => sum + d.amount, 0) / filteredDonations.length).toFixed(2) 
                                : "0.00"}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Per donation average
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Donation History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">Loading donations...</div>
                    ) : filteredDonations?.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDonations.map((donation) => (
                                    <TableRow key={donation.id}>
                                        <TableCell>
                                            {donation.user.email || donation.user.username || "Anonymous"}
                                        </TableCell>
                                        <TableCell>{formatDateTime(donation.created_at)}</TableCell>
                                        <TableCell>{donation.donation_type}</TableCell>
                                        <TableCell>${donation.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                donation.payment_status === "completed" ? "default" :
                                                donation.payment_status === "pending" ? "secondary" :
                                                donation.payment_status === "failed" ? "destructive" : "outline"
                                            }>
                                                {donation.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {donation.payment_status === "pending" && (
                                                <div className="flex space-x-2">
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(donation.id, "completed")}
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(donation.id, "failed")}
                                                    >
                                                        Mark Failed
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            No donations found for the selected date range.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
