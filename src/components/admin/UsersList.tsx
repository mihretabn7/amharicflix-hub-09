import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const columns = [
    { accessorKey: "username", header: "Username" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "last_sign_in", header: "Last Active" },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="outline" size="sm">View History</Button>
                <Button variant="destructive" size="sm">Ban</Button>
            </div>
        ),
    },
];

export function UsersList() {
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Users</h2>
            <DataTable columns={columns} data={users || []} />
        </div>
    );
} 