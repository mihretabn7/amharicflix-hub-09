import { useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CSVUpload = () => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/csv") {
            toast.error("Please upload a CSV file");
            return;
        }

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const rows = text.split("\n").map(row => row.split(","));
                const headers = rows[0];

                // Validate headers
                const requiredHeaders = ["youtube_title", "thumbnail", "duration_minutes"];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
                    return;
                }

                // Process data
                const movies = rows.slice(1).map(row => {
                    const movie: any = {};
                    headers.forEach((header, index) => {
                        const value = row[index]?.trim();
                        if (value) {
                            // Map CSV headers to database columns
                            switch (header.trim()) {
                                case "youtube_title":
                                    movie.title = value;
                                    break;
                                case "thumbnail":
                                    movie.thumbnail_url = value;
                                    break;
                                case "duration_minutes":
                                    movie.duration_minutes = parseInt(value);
                                    break;
                                default:
                                    movie[header.trim()] = value;
                            }
                        }
                    });

                    // Set default values
                    movie.language = "Amharic";
                    movie.genre = movie.genre || "Movie";
                    movie.is_hidden = false;

                    return movie;
                });

                // Upload to Supabase
                const { error } = await supabase
                    .from("movies")
                    .insert(movies.filter(m => m.title && m.thumbnail_url));

                if (error) throw error;
                toast.success(`Successfully uploaded ${movies.length} movies`);
            };
            reader.readAsText(file);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>CSV Upload</CardTitle>
                    <CardDescription>
                        Bulk upload movies using a CSV file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CSV Format Requirements</AlertTitle>
                        <AlertDescription>
                            Your CSV file must include the following columns:
                            <ul className="list-disc list-inside mt-2">
                                <li>youtube_title (required) - Title of the movie</li>
                                <li>thumbnail (required) - Thumbnail URL</li>
                                <li>duration_minutes (required) - Duration in minutes</li>
                                <li>description (optional)</li>
                                <li>youtube_id (optional)</li>
                            </ul>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Note: Language will be set to "Amharic" and genre to "Movie" by default
                            </p>
                        </AlertDescription>
                    </Alert>

                    <div className="mt-6">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload">
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={isUploading}
                                asChild
                            >
                                <div>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? "Uploading..." : "Upload CSV"}
                                </div>
                            </Button>
                        </label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CSVUpload; 