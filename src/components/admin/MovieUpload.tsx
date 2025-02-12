import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MovieUpload() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result;
            if (typeof text !== 'string') return;

            // Parse CSV
            const rows = text.split('\n');
            const headers = rows[0].split(',');
            const data = rows.slice(1).map(row => {
                const values = row.split(',');
                return headers.reduce((obj: any, header, index) => {
                    obj[header.trim()] = values[index]?.trim();
                    return obj;
                }, {});
            });

            setCsvData(data);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert(csvData)
                .select();

            if (error) throw error;

            toast({
                title: "Success",
                description: `${csvData.length} movies uploaded successfully`,
            });
            setCsvData([]);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload movies",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Movie Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleCsvUpload}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Label
                                htmlFor="csv-upload"
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <FileText className="h-8 w-8 mb-2" />
                                <span className="text-sm font-medium">
                                    Drop your CSV file here or click to browse
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Supports: title, description, genre, language, video_url, thumbnail_url
                                </span>
                            </Label>
                        </div>

                        {csvData.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-medium">Preview ({csvData.length} movies)</h3>
                                <ScrollArea className="h-[300px] rounded-md border">
                                    <div className="p-4">
                                        <table className="w-full">
                                            <thead>
                                                <tr>
                                                    {Object.keys(csvData[0]).map((header) => (
                                                        <th key={header} className="text-left p-2">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvData.map((row, index) => (
                                                    <tr key={index}>
                                                        {Object.values(row).map((value: any, i) => (
                                                            <td key={i} className="p-2">
                                                                {value}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ScrollArea>

                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload {csvData.length} Movies
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 