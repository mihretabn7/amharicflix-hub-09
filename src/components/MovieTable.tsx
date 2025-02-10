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
import { Pencil, Trash, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  created_at?: string;
  thumbnail_url?: string;
  verified_report_count?: number;
  movie_ratings?: {
    rating: number;
    created_at: string;
  }[];
}

const defaultMovie: Movie = {
  id: '',
  title: '',
  description: null,
  genre: null,
  youtube_id: '',
  language: null,
  duration_minutes: null,
  watch_count: null,
  share_count: null,
  is_hidden: false,
};

interface MovieFormProps {
  initialData?: Movie;
  onSubmit: (data: Movie) => void;
  onCancel: () => void;
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

const ITEMS_PER_PAGE = 10;

const MovieTable = () => {
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const { data: moviesData, refetch } = useQuery({
    queryKey: ["admin-movies", currentPage, sortBy, sortOrder, filterGenre, filterLanguage, filterVisibility],
    queryFn: async () => {
      let query = supabase
        .from("movies")
        .select("*, movie_ratings(rating)", { count: "exact" });

      // Apply filters
      if (filterGenre !== "all") {
        query = query.eq("genre", filterGenre);
      }
      if (filterLanguage !== "all") {
        query = query.eq("language", filterLanguage);
      }
      if (filterVisibility !== "all") {
        query = query.eq("is_hidden", filterVisibility === "hidden");
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) {
        toast.error("Failed to fetch movies");
        throw error;
      }

      return { data, count };
    },
  });

  const { data: filters } = useQuery({
    queryKey: ["movie-filters"],
    queryFn: async () => {
      const [genresResponse, languagesResponse] = await Promise.all([
        supabase.from("movies").select("genre").not("genre", "is", null),
        supabase.from("movies").select("language").not("language", "is", null)
      ]);

      const uniqueGenres = [...new Set(genresResponse.data?.map(m => m.genre))];
      const uniqueLanguages = [...new Set(languagesResponse.data?.map(m => m.language))];

      return {
        genres: uniqueGenres,
        languages: uniqueLanguages
      };
    }
  });

  const totalPages = Math.ceil((moviesData?.count || 0) / ITEMS_PER_PAGE);

  const filteredMovies = moviesData?.data.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelect = (movieId: string, checked: boolean) => {
    if (checked) {
      setSelectedMovies((prev) => [...prev, movieId]);
    } else {
      setSelectedMovies((prev) => prev.filter((id) => id !== movieId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovies(moviesData?.data.map((movie) => movie.id) || []);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search movies..."
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2 space-y-2">
                <div>
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={filterGenre} onValueChange={setFilterGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {filters?.genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {filters?.languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Visibility</label>
                  <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
                  checked={selectedMovies.length === filteredMovies.length && filteredMovies.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => {
                if (sortBy === "title") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("title");
                  setSortOrder("asc");
                }
              }}>
                Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Language</TableHead>
              <TableHead className="cursor-pointer" onClick={() => {
                if (sortBy === "watch_count") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("watch_count");
                  setSortOrder("desc");
                }
              }}>
                Views {sortBy === "watch_count" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
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
                <TableCell>{movie.watch_count || 0}</TableCell>
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, moviesData?.count || 0)} of {moviesData?.count || 0} movies
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MovieTable;