import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Youtube, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface YouTubeFetchButtonProps {
  onSuccess?: () => void;
}

const YouTubeFetchButton = ({ onSuccess }: YouTubeFetchButtonProps) => {
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<{ processed: number; totalUnique: number } | null>(null);

  const handleFetch = async () => {
    setFetching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies');

      if (error) {
        let errorMessage = error.message;
        try {
          const errorBody = JSON.parse(error.message);
          errorMessage = errorBody.error || errorBody.message || error.message;
        } catch {
          // use original message
        }
        throw new Error(errorMessage);
      }

      if (data?.success) {
        setResult({ processed: data.processed, totalUnique: data.totalUnique });
        toast.success(
          `Fetched ${data.processed} new movies from YouTube! (${data.totalUnique} total unique found)`
        );
        onSuccess?.();
      } else {
        throw new Error('Unexpected response from fetch function');
      }
    } catch (error: any) {
      console.error('Error fetching from YouTube:', error);
      toast.error(error.message || 'Failed to fetch movies from YouTube');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFetch}
              disabled={fetching}
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4" />
              )}
              {fetching ? 'Fetching...' : 'Fetch from YouTube'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search YouTube for Ethiopian/Amharic movies and add them to the database</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {result && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>+{result.processed} new</span>
        </div>
      )}
    </div>
  );
};

export default YouTubeFetchButton;
