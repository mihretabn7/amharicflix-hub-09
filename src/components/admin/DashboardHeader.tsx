
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DashboardHeader = () => {
    const { data: adminUser } = useQuery({
        queryKey: ['admin-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            return profile;
        }
    });

    return (
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Dashboard Overview</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={adminUser?.avatar_url || ''} />
                        <AvatarFallback>
                            {adminUser?.username?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium">{adminUser?.username || 'Admin'}</p>
                        <p className="text-xs text-muted-foreground">Administrator</p>
                    </div>
                </div>
                <Button variant="outline" size="sm">
                    Monthly
                </Button>
            </div>
        </div>
    );
};
