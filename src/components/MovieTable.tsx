import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash } from "lucide-react";
import { Movie } from "@/types/movie";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MovieTableProps {
  movies: Movie[];
  onRefresh: () => void;
}

export const MovieTable = ({ movies, onRefresh }: MovieTableProps) => {
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovies(movies.map(movie => movie.id));
    } else {
      setSelectedMovies([]);
    }
  };

  const handleSelect = (movieId: string, checked: boolean) => {
    if (checked) {
      setSelectedMovies(prev => [...prev, movieId]);
    } else {
      setSelectedMovies(prev => prev.filter(id => id !== movieId));
    }
  };

  const handleDelete = async (movieId: string) => {
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .in('id', selectedMovies);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Selected movies deleted successfully",
      });
      setSelectedMovies([]);
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected movies",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (movieData: Partial<Movie>) => {
    if (!editingMovie) return;

    try {
      const { error } = await supabase
        .from('movies')
        .update(movieData)
        .eq('id', editingMovie.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Movie updated successfully",
      });
      setEditingMovie(null);
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update movie",
        variant: "destructive",
      });
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
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
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>{movie.genre || 'N/A'}</TableCell>
                <TableCell>{movie.language || 'N/A'}</TableCell>
                <TableCell>{movie.watch_count || 0}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMovie(movie)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Movie</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label>Title</label>
                            <Input
                              defaultValue={movie.title}
                              onChange={(e) => setEditingMovie(prev => prev ? { ...prev, title: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label>Genre</label>
                            <Input
                              defaultValue={movie.genre || ''}
                              onChange={(e) => setEditingMovie(prev => prev ? { ...prev, genre: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label>Language</label>
                            <Input
                              defaultValue={movie.language || ''}
                              onChange={(e) => setEditingMovie(prev => prev ? { ...prev, language: e.target.value } : null)}
                            />
                          </div>
                          <Button onClick={() => editingMovie && handleUpdate(editingMovie)}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
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