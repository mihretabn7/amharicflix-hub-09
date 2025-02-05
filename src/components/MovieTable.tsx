import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";

interface Movie {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  youtube_id: string;
  language: string | null;
  duration_minutes: number | null;
  watch_count: number | null;
  share_count: number | null;
}

const MovieTable = () => {
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: movies = [], refetch } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch movies");
        throw error;
      }

      return data as Movie[];
    },
  });

  const handleSelect = (movieId: string, checked: boolean) => {
    if (checked) {
      setSelectedMovies(prev => [...prev, movieId]);
    } else {
      setSelectedMovies(prev => prev.filter(id => id !== movieId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovies(movies.map(movie => movie.id));
    } else {
      setSelectedMovies([]);
    }
  };

  const handleDelete = async (movieId: string) => {
    try {
      const { error } = await supabase
        .from("movies")
        .delete()
        .eq("id", movieId);

      if (error) throw error;

      toast.success("Movie deleted successfully");
      refetch();
      setSelectedMovies(prev => prev.filter(id => id !== movieId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from("movies")
        .delete()
        .in("id", selectedMovies);

      if (error) throw error;

      toast.success("Selected movies deleted successfully");
      refetch();
      setSelectedMovies([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (movie.genre?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
       <Input
         placeholder="Search movies..."
         className="px-4 py-2 border rounded-md"
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
       />
        {selectedMovies.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedMovies.length})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedMovies.length === movies.length && movies.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovies.map((movie) => (
              <TableRow key={movie.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMovies.includes(movie.id)}
                    onCheckedChange={(checked) => handleSelect(movie.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>{movie.title}</TableCell>
                <TableCell>{movie.genre || "-"}</TableCell>
                <TableCell>{movie.language || "-"}</TableCell>
                <TableCell>{movie.duration_minutes || 0}</TableCell>
                <TableCell>{movie.watch_count || 0}</TableCell>
                <TableCell>{movie.share_count || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toast.info("Edit functionality coming soon")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(movie.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MovieTable;