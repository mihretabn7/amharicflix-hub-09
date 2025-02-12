import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const columns = [
    { accessorKey: "movie.title", header: "Movie" },
    { accessorKey: "reporter.username", header: "Reported By" },
    { accessorKey: "reason", header: "Reason" },
    { accessorKey: "created_at", header: "Report Date" },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="outline" size="sm">Review</Button>
                <Button variant="destructive" size="sm">Remove Movie</Button>
            </div>
        ),
    },
];

export function MovieReports() {
    const { data: reports, isLoading } = useQuery({
        queryKey: ['movie-reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movie_reports')
                .select(`
          *,
          movie:movie_id(title),
          reporter:user_id(username)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Movie Reports</h2>
            <DataTable columns={columns} data={reports || []} />
        </div>
    );
} 