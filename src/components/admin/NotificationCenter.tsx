
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Search, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    user_id: string | null;
    is_sent: boolean;
}

const NotificationCenter = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [newNotification, setNewNotification] = useState({
        title: "",
        message: "",
        type: "info"
    });

    const { data: notifications, refetch } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Notification[];
        }
    });

    const handleSendNotification = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    ...newNotification,
                    is_sent: true
                });

            if (error) throw error;

            toast.success("Notification sent successfully");
            setNewNotification({
                title: "",
                message: "",
                type: "info"
            });
            refetch();
        } catch (error: any) {
            toast.error("Failed to send notification");
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Notification deleted successfully");
            refetch();
        } catch (error: any) {
            toast.error("Failed to delete notification");
        }
    };

    const filteredNotifications = notifications?.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Send New Notification</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={newNotification.title}
                                onChange={(e) =>
                                    setNewNotification({
                                        ...newNotification,
                                        title: e.target.value
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={newNotification.message}
                                onChange={(e) =>
                                    setNewNotification({
                                        ...newNotification,
                                        message: e.target.value
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={newNotification.type}
                                onValueChange={(value: string) =>
                                    setNewNotification({
                                        ...newNotification,
                                        type: value
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select notification type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSendNotification} className="w-full">
                            <Bell className="mr-2 h-4 w-4" />
                            Send Notification
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent At</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotifications?.map((notification) => (
                                    <TableRow key={notification.id}>
                                        <TableCell>{notification.title}</TableCell>
                                        <TableCell>{notification.message}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    notification.type === "success"
                                                        ? "bg-green-50 text-green-700"
                                                        : notification.type === "error"
                                                            ? "bg-red-50 text-red-700"
                                                            : notification.type === "warning"
                                                                ? "bg-yellow-50 text-yellow-700"
                                                                : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                {notification.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    notification.is_sent
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-yellow-50 text-yellow-700"
                                                }`}
                                            >
                                                {notification.is_sent ? "Sent" : "Pending"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(notification.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteNotification(notification.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationCenter;
