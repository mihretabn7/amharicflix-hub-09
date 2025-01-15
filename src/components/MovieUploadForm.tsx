import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MovieUploadFormProps {
  onSuccess?: () => void;
}

const MovieUploadForm = ({ onSuccess }: MovieUploadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    youtubeId: "",
    thumbnailUrl: "",
    description: "",
    genre: "",
    language: "Amharic",
    durationMinutes: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("movies").insert([
        {
          title: formData.title,
          youtube_id: formData.youtubeId,
          thumbnail_url: formData.thumbnailUrl,
          description: formData.description,
          genre: formData.genre,
          language: formData.language,
          duration_minutes: formData.durationMinutes,
        },
      ]);

      if (error) throw error;

      toast.success("Movie uploaded successfully!");
      setFormData({
        title: "",
        youtubeId: "",
        thumbnailUrl: "",
        description: "",
        genre: "",
        language: "Amharic",
        durationMinutes: 0,
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">YouTube ID</label>
        <Input
          value={formData.youtubeId}
          onChange={(e) =>
            setFormData({ ...formData, youtubeId: e.target.value })
          }
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
        <Input
          value={formData.thumbnailUrl}
          onChange={(e) =>
            setFormData({ ...formData, thumbnailUrl: e.target.value })
          }
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Genre</label>
        <Input
          value={formData.genre}
          onChange={(e) =>
            setFormData({ ...formData, genre: e.target.value })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
        <Input
          type="number"
          value={formData.durationMinutes}
          onChange={(e) =>
            setFormData({
              ...formData,
              durationMinutes: parseInt(e.target.value) || 0,
            })
          }
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-netflix-red hover:bg-netflix-red/90"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Movie"}
      </Button>
    </form>
  );
};

export default MovieUploadForm;