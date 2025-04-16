import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenreSuggestionProps {
  movieId: string;
  userId: string;
  onSuggestionSubmit?: () => void;
}

const GenreSuggestion = ({ movieId, userId, onSuggestionSubmit }: GenreSuggestionProps) => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('genre_suggestions')
        .insert({
          movie_id: movieId,
          user_id: userId,
          suggested_genre: data.genre
        });

      if (error) throw error;

      toast.success("Genre suggestion submitted!");
      reset();
      if (onSuggestionSubmit) onSuggestionSubmit();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        placeholder="Suggest a genre..."
        {...register("genre", { required: true })}
      />
      <Button type="submit">
        Submit Suggestion
      </Button>
    </form>
  );
};

export default GenreSuggestion;