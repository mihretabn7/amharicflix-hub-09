import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    MoreVertical,
    Search,
    Plus,
    Pencil,
    Trash,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Movie {
    id: string;
    title: string;
    genre: string;
    language: string;
    watch_count: number;
    is_hidden: boolean;
    created_at: string;
    thumbnail_url: string;
}

const MovieManagement = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMovies, setSelectedMovies] = useState<string[]>([]);

    const { data: movies, isLoading, refetch } = useQuery({
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

    const handleVisibilityToggle = async (movieId: string, currentState: boolean) => {
        try {
            const { error } = await supabase
                .from('movies')
                .update({ is_hidden: !currentState })
                .eq('id', movieId);

            if (error) throw error;

            toast.success('Movie visibility updated');
            refetch();
        } catch (error) {
            toast.error('Failed to update movie visibility');
        }
    };

    const handleDelete = async (movieId: string) => {
        try {
            const { error } = await supabase
                .from('movies')
                .delete()
                .eq('id', movieId);

            if (error) throw error;

            toast.success('Movie deleted successfully');
            refetch();
        } catch (error) {
            toast.error('Failed to delete movie');
        }
    };

    const filteredMovies = movies?.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search movies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[300px]"
                        icon={<Search className="h-4 w-4" />}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    {selectedMovies.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                // Implement bulk delete
                            }}
                        >
                            Delete Selected ({selectedMovies.length})
                        </Button>
                    )}
                    <Button onClick={() => {/* Open Add Movie Modal */ }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Movie
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedMovies(movies?.map(m => m.id) || []);
                                        } else {
                                            setSelectedMovies([]);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead className="text-center">Views</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovies?.map((movie) => (
                            <TableRow key={movie.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedMovies.includes(movie.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMovies([...selectedMovies, movie.id]);
                                            } else {
                                                setSelectedMovies(selectedMovies.filter(id => id !== movie.id));
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={movie.thumbnail_url}
                                            alt={movie.title}
                                            className="h-8 w-12 object-cover rounded"
                                        />
                                        <span>{movie.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{movie.genre}</TableCell>
                                <TableCell>{movie.language}</TableCell>
                                <TableCell className="text-center">{movie.watch_count}</TableCell>
                                <TableCell className="text-center">
                                    <Switch
                                        checked={!movie.is_hidden}
                                        onCheckedChange={() => handleVisibilityToggle(movie.id, movie.is_hidden)}
                                    />
                                </TableCell>
                                <TableCell>{format(new Date(movie.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => {/* Open Edit Modal */ }}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleVisibilityToggle(movie.id, movie.is_hidden)}
                                            >
                                                {movie.is_hidden ? (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-2" /> Show
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-2" /> Hide
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDelete(movie.id)}
                                            >
                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default MovieManagement; 