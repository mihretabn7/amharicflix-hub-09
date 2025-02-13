import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, CheckCircle, Mail, Calendar, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export default function UserManagement() {
    const { data: users, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Users query error:', error);
                throw error;
            }

            return data || [];
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "username",
            header: "User",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={row.original.avatar_url} />
                        <AvatarFallback>
                            {row.original.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{row.original.username}</p>
                        <p className="text-sm text-muted-foreground">{row.original.email}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${row.original.is_admin ? "text-purple-500" : "text-muted-foreground"}`} />
                    <span>{row.original.is_admin ? "Admin" : "User"}</span>
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Joined",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            accessorKey: "last_sign_in_at",
            header: "Last Sign In",
            cell: ({ row }) => row.original.last_sign_in_at ?
                new Date(row.original.last_sign_in_at).toLocaleDateString() :
                "Never"
        },
        {
            accessorKey: "is_blocked",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!row.original.is_blocked}
                        onCheckedChange={(checked) => handleBlockToggle(row.original.id, !checked)}
                        className="data-[state=checked]:bg-green-500"
                    />
                    <span className="flex items-center gap-1 text-sm">
                        {!row.original.is_blocked ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">Active</span>
                            </>
                        ) : (
                            <>
                                <Ban className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">Blocked</span>
                            </>
                        )}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(row.original.email)}
                >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                </Button>
            ),
        }
    ];

    const handleBlockToggle = async (id: string, isBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: isBlocked })
                .eq('id', id);

            if (error) throw error;

            toast.success(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`);
            refetch();
        } catch (error: any) {
            toast.error('Failed to update user status');
            console.error(error);
        }
    };

    const handleSendEmail = (email: string) => {
        // Implement email functionality or open default mail client
        window.location.href = `mailto:${email}`;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
            </div>

            <DataTable
                data={users || []}
                columns={columns}
            />
        </div>
    );
} 