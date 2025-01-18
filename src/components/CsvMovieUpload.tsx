import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const CsvMovieUpload = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      // First read the file to validate its structure
      const text = await file.text();
      const rows = text.split('\n');
      
      if (rows.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = rows[0].toLowerCase().split(',');
      const requiredFields = ['title', 'youtube_id', 'thumbnail_url'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));

      if (missingFields.length > 0) {
        toast.error(`CSV file must contain these columns: ${missingFields.join(', ')}`);
        return;
      }

      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_movie_uploads')
        .insert({
          filename: file.name,
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Create a blob from the file to ensure proper content type
      const blob = new Blob([text], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, file.name);
      formData.append('upload_id', uploadData.id);

      const { data, error } = await supabase.functions.invoke('process-csv-upload', {
        body: formData,
      });

      if (error) {
        // Parse the error message from the response if possible
        let errorMessage = error.message;
        try {
          const errorBody = JSON.parse(error.message);
          errorMessage = errorBody.error || errorBody.message || error.message;
        } catch {
          // If parsing fails, use the original error message
        }
        throw new Error(errorMessage);
      }

      toast.success('CSV file uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.message || 'Error uploading CSV file');
    } finally {
      setUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  return (
    <div className="mt-4">
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
          disabled={uploading}
          asChild
        >
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Movies CSV'}
          </span>
        </Button>
      </label>
      <p className="text-sm text-muted-foreground mt-2">
        CSV must include: title, youtube_id, thumbnail_url columns
      </p>
    </div>
  );
};

export default CsvMovieUpload;