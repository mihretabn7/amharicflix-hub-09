import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Notifications() {
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await supabase.from('notifications').select('*');
            return data;
        }
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Notifications</h1>
            <Card>
                <CardHeader>
                    <CardTitle>System Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        {notifications?.map((notification) => (
                            <div key={notification.id} className="p-4 border-b">
                                <h3 className="font-medium">{notification.title}</h3>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                            </div>
                        ))}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
} 