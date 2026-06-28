import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MovieUploadForm from "@/components/MovieUploadForm";
import CsvMovieUpload from "@/components/CsvMovieUpload";
import YouTubeFetchButton from "@/components/YouTubeFetchButton";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Eye, EyeOff, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MovieManagement() {
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterGenre, setFilterGenre] = useState<string>("all");
    const [filterLanguage, setFilterLanguage] = useState<string>("all");
    const [filterVisibility, setFilterVisibility] = useState<string>("all");

    const { data: movies, refetch } = useQuery({
        queryKey: ['movies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Movies query error:', error);
                throw error;
            }

            return data || [];
        }
    });

    const genres = [...new Set(movies?.map(movie => movie.genre).filter(Boolean))];
    const languages = [...new Set(movies?.map(movie => movie.language).filter(Boolean))];

    const filteredMovies = movies?.filter(movie => {
        const matchesSearch =
            movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            movie.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            movie.genre?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesGenre = filterGenre === "all" || movie.genre === filterGenre;
        const matchesLanguage = filterLanguage === "all" || movie.language === filterLanguage;
        const matchesVisibility = filterVisibility === "all" ||
            (filterVisibility === "visible" && !movie.is_hidden) ||
            (filterVisibility === "hidden" && movie.is_hidden);

        return matchesSearch && matchesGenre && matchesLanguage && matchesVisibility;
    });

    useEffect(() => {
    }, []);

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
                        <div className="mt-4 border-t pt-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Auto-Fetch from YouTube</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Automatically search &amp; import Ethiopian/Amharic movies
                                </p>
                                <YouTubeFetchButton onSuccess={refetch} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-2">CSV Bulk Upload</h3>
                                <CsvMovieUpload />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search movies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterGenre} onValueChange={setFilterGenre}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by genre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genres</SelectItem>
                            {genres.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                    {genre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Languages</SelectItem>
                            {languages.map((language) => (
                                <SelectItem key={language} value={language}>
                                    {language}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="visible">Visible</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DataTable
                data={filteredMovies || []}
                columns={columns}
            />

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
