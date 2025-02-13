import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MovieUploadForm from "@/components/MovieUploadForm";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function MovieManagement() {
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const { data: movies, refetch } = useQuery({
        queryKey: ['movies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movies')
                .select('*')  // Simplified query first to debug
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Movies query error:', error);
                throw error;
            }

            console.log('Movies data:', data); // Let's see what we're getting
            return data || []; // Ensure we return an empty array if data is null
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <img
                        src={row.original.thumbnail_url}
                        alt={row.original.title}
                        className="w-10 h-10 rounded object-cover"
                    />
                    <span>{row.original.title}</span>
                </div>
            )
        },
        {
            accessorKey: "genre",
            header: "Genre",
            cell: ({ row }) => (
                <span className="capitalize">{row.original.genre}</span>
            )
        },
        {
            accessorKey: "language",
            header: "Language",
            cell: ({ row }) => (
                <span className="capitalize">{row.original.language}</span>
            )
        },
        {
            accessorKey: "watch_count",
            header: "Views",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{row.original.watch_count || 0}</span>
                </div>
            )
        },
        {
            accessorKey: "is_hidden",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!row.original.is_hidden}
                        onCheckedChange={(checked) => handleVisibilityToggle(row.original.id, !checked)}
                        className="data-[state=checked]:bg-green-500"
                    />
                    <span className="flex items-center gap-1 text-sm">
                        {!row.original.is_hidden ? (
                            <>
                                <Eye className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">Visible</span>
                            </>
                        ) : (
                            <>
                                <EyeOff className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">Hidden</span>
                            </>
                        )}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Added On",
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedMovie(row.original);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.original.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        }
    ];

    // Add this to check what's being passed to DataTable
    console.log('DataTable props:', {
        data: movies || [],
        columns
    });

    const handleEdit = async (formData: any) => {
        try {
            const { error } = await supabase
                .from('movies')
                .update({
                    title: formData.title,
                    description: formData.description,
                    genre: formData.genre,
                    language: formData.language,
                    youtube_id: formData.youtube_id,
                    thumbnail_url: formData.thumbnail_url,
                    release_date: formData.release_date,
                    duration: formData.duration,
                    is_featured: formData.is_featured,
                })
                .eq('id', selectedMovie.id);

            if (error) throw error;

            toast.success('Movie updated successfully');
            setIsEditDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast.error('Failed to update movie');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this movie?')) return;

        try {
            const { error } = await supabase
                .from('movies')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Movie deleted successfully');
            refetch();
        } catch (error: any) {
            toast.error('Failed to delete movie');
            console.error(error);
        }
    };

    const handleVisibilityToggle = async (id: string, isHidden: boolean) => {
        try {
            const { error } = await supabase
                .from('movies')
                .update({ is_hidden: isHidden })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Movie ${isHidden ? 'hidden' : 'visible'} successfully`);
            refetch();
        } catch (error: any) {
            toast.error('Failed to update movie visibility');
            console.error(error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Movie Management</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Add New Movie</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Movie</DialogTitle>
                        </DialogHeader>
                        <MovieUploadForm onSuccess={refetch} />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                data={movies || []}
                columns={columns}
            />

            {/* Edit Movie Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Movie</DialogTitle>
                    </DialogHeader>
                    <MovieUploadForm
                        onSuccess={refetch}
                        initialData={selectedMovie}
                        isEditing={true}
                        onSubmit={handleEdit}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 