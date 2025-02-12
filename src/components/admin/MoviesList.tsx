import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const columns = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "genre", header: "Genre" },
    { accessorKey: "language", header: "Language" },
    { accessorKey: "watch_count", header: "Views" },
    { accessorKey: "created_at", header: "Upload Date" },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
            </div>
        ),
    },
];

export function MoviesList() {
    const { data: movies, isLoading } = useQuery({
        queryKey: ['admin-movies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Movies</h2>
                <Button>Add Movie</Button>
            </div>
            <DataTable columns={columns} data={movies || []} />
        </div>
    );
} 