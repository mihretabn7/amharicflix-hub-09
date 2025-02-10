import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

interface SeriesFormData {
    title: string;
    description: string;
    genre: string;
    language: string;
    youtube_id: string;
    thumbnail_url: string;
}

interface EpisodeFormData {
    title: string;
    description: string;
    youtube_id: string;
    thumbnail_url: string;
    episode_number: number;
}

const defaultSeriesData: SeriesFormData = {
    title: "",
    description: "",
    genre: "",
    language: "",
    youtube_id: "",
    thumbnail_url: "",
};

const defaultEpisodeData: EpisodeFormData = {
    title: "",
    description: "",
    youtube_id: "",
    thumbnail_url: "",
    episode_number: 1,
};

const SeriesManagement = () => {
    const [seriesFormData, setSeriesFormData] = useState<SeriesFormData>(defaultSeriesData);
    const [episodeFormData, setEpisodeFormData] = useState<EpisodeFormData>(defaultEpisodeData);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);

    const handleCreateSeries = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert({
                    ...seriesFormData,
                    is_hidden: false,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Series created successfully!");
            setSeriesFormData(defaultSeriesData);
            setSelectedSeriesId(data.id);
            setShowEpisodeDialog(true);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleAddEpisode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeriesId) {
            toast.error("No series selected");
            return;
        }

        try {
            const { error } = await supabase
                .from('movies')
                .insert({
                    ...episodeFormData,
                    series_id: selectedSeriesId,
                    is_hidden: false,
                });

            if (error) throw error;

            toast.success("Episode added successfully!");
            setEpisodeFormData({
                ...defaultEpisodeData,
                episode_number: episodeFormData.episode_number + 1,
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Series</CardTitle>
                    <CardDescription>
                        Add a new series to your collection
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateSeries} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={seriesFormData.title}
                                onChange={(e) =>
                                    setSeriesFormData({ ...seriesFormData, title: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={seriesFormData.description}
                                onChange={(e) =>
                                    setSeriesFormData({ ...seriesFormData, description: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Genre</label>
                                <Input
                                    value={seriesFormData.genre}
                                    onChange={(e) =>
                                        setSeriesFormData({ ...seriesFormData, genre: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <Input
                                    value={seriesFormData.language}
                                    onChange={(e) =>
                                        setSeriesFormData({ ...seriesFormData, language: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">YouTube ID</label>
                            <Input
                                value={seriesFormData.youtube_id}
                                onChange={(e) =>
                                    setSeriesFormData({ ...seriesFormData, youtube_id: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Thumbnail URL</label>
                            <Input
                                value={seriesFormData.thumbnail_url}
                                onChange={(e) =>
                                    setSeriesFormData({ ...seriesFormData, thumbnail_url: e.target.value })
                                }
                                required
                            />
                        </div>
                        <Button type="submit">Create Series</Button>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Episode</DialogTitle>
                        <DialogDescription>
                            Add episodes to your series
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddEpisode} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={episodeFormData.title}
                                onChange={(e) =>
                                    setEpisodeFormData({ ...episodeFormData, title: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={episodeFormData.description}
                                onChange={(e) =>
                                    setEpisodeFormData({ ...episodeFormData, description: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">YouTube ID</label>
                            <Input
                                value={episodeFormData.youtube_id}
                                onChange={(e) =>
                                    setEpisodeFormData({ ...episodeFormData, youtube_id: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Thumbnail URL</label>
                            <Input
                                value={episodeFormData.thumbnail_url}
                                onChange={(e) =>
                                    setEpisodeFormData({ ...episodeFormData, thumbnail_url: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Episode Number</label>
                            <Input
                                type="number"
                                value={episodeFormData.episode_number}
                                onChange={(e) =>
                                    setEpisodeFormData({
                                        ...episodeFormData,
                                        episode_number: parseInt(e.target.value),
                                    })
                                }
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEpisodeDialog(false)}>
                                Done
                            </Button>
                            <Button type="submit">Add Episode</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SeriesManagement; 