import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface UploadFormData {
    title: string;
    description: string;
    youtube_id: string;
    thumbnail_url: string;
    genre: string;
    language: string;
    duration_minutes: string;
    type: "movie" | "series";
}

const initialFormData: UploadFormData = {
    title: "",
    description: "",
    youtube_id: "",
    thumbnail_url: "",
    genre: "",
    language: "",
    duration_minutes: "",
    type: "movie"
};

const ContentUpload = () => {
    const [formData, setFormData] = useState<UploadFormData>(initialFormData);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            const { error } = await supabase
                .from('movies')
                .insert({
                    ...formData,
                    duration_minutes: parseInt(formData.duration_minutes),
                    is_hidden: false
                });

            if (error) throw error;

            toast.success("Content uploaded successfully!");
            setFormData(initialFormData);
        } catch (error: any) {
            toast.error("Failed to upload content");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Content</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content Type</label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: "movie" | "series") =>
                                setFormData({ ...formData, type: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="movie">Movie</SelectItem>
                                <SelectItem value="series">Series</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Genre</label>
                            <Input
                                value={formData.genre}
                                onChange={(e) =>
                                    setFormData({ ...formData, genre: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Language</label>
                            <Input
                                value={formData.language}
                                onChange={(e) =>
                                    setFormData({ ...formData, language: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">YouTube ID</label>
                        <Input
                            value={formData.youtube_id}
                            onChange={(e) =>
                                setFormData({ ...formData, youtube_id: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thumbnail URL</label>
                        <Input
                            value={formData.thumbnail_url}
                            onChange={(e) =>
                                setFormData({ ...formData, thumbnail_url: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (minutes)</label>
                        <Input
                            type="number"
                            value={formData.duration_minutes}
                            onChange={(e) =>
                                setFormData({ ...formData, duration_minutes: e.target.value })
                            }
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isUploading} className="w-full">
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Content
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ContentUpload; 