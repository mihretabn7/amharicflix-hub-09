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
      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_movie_uploads')
        .insert({
          filename: file.name,
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Create a blob from the file to ensure proper content type
      const blob = new Blob([await file.arrayBuffer()], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, file.name);
      formData.append('upload_id', uploadData.id);

      const { data, error } = await supabase.functions.invoke('process-csv-upload', {
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (error) throw error;

      toast.success('CSV file uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.message || 'Error uploading CSV file');
    } finally {
      setUploading(false);
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
    </div>
  );
};

export default CsvMovieUpload;