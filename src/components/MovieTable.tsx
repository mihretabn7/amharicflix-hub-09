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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  is_hidden: boolean;
}

const EditMovieModal = ({
  movie,
  onClose,
  onSave,
}: {
  movie: Movie;
  onClose: () => void;
  onSave: (updatedMovie: Movie) => void;
}) => {
  const [formData, setFormData] = useState<Movie>(movie);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Movie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label>Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Input
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label>Genre</label>
              <Input
                value={formData.genre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label>YouTube ID</label>
              <Input
                value={formData.youtube_id}
                onChange={(e) =>
                  setFormData({ ...formData, youtube_id: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label>Language</label>
              <Input
                value={formData.language || ""}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label>Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration_minutes || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || null,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MovieTable = () => {
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

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
      setSelectedMovies((prev) => [...prev, movieId]);
    } else {
      setSelectedMovies((prev) => prev.filter((id) => id !== movieId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovies(movies.map((movie) => movie.id));
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
      setSelectedMovies((prev) => prev.filter((id) => id !== movieId));
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

  const handleUpdateMovie = async (updatedMovie: Movie) => {
    try {
      const { error } = await supabase
        .from("movies")
        .update(updatedMovie)
        .eq("id", updatedMovie.id);

      if (error) throw error;

      toast.success("Movie updated successfully");
      refetch();
      setEditingMovie(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update movie");
    }
  };

  const handleToggleVisibility = async (movieId: string, isHidden: boolean) => {
    try {
      const { error } = await supabase
        .from("movies")
        .update({ is_hidden: isHidden })
        .eq("id", movieId);

      if (error) throw error;

      toast.success(isHidden ? "Movie hidden successfully" : "Movie is now visible");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
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
          <Button variant="destructive" onClick={handleDeleteSelected}>
            Delete Selected ({selectedMovies.length})
          </Button>
        )}
      </div>

      {editingMovie && (
        <EditMovieModal
          movie={editingMovie}
          onClose={() => setEditingMovie(null)}
          onSave={handleUpdateMovie}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedMovies.length === movies.length && movies.length > 0
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovies.map((movie) => (
              <TableRow key={movie.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMovies.includes(movie.id)}
                    onCheckedChange={(checked) =>
                      handleSelect(movie.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>{movie.title}</TableCell>
                <TableCell>{movie.genre || "-"}</TableCell>
                <TableCell>{movie.language || "-"}</TableCell>
                <TableCell>{movie.duration_minutes || 0}</TableCell>
                <TableCell>{movie.watch_count || 0}</TableCell>
                <TableCell>{movie.share_count || 0}</TableCell>
                <TableCell>
                  <Button
                    variant={movie.is_hidden ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleToggleVisibility(movie.id, !movie.is_hidden)}
                  >
                    {movie.is_hidden ? "Hidden" : "Visible"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingMovie(movie)}
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