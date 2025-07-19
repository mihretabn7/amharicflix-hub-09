/**
 * Utility function to extract and display the first genre from a comma-separated list
 * @param genre - Genre string that might contain multiple genres separated by commas
 * @returns First genre from the list or empty string if no genre
 */
export const getFirstGenre = (genre: string | null | undefined): string => {
  if (!genre) return "";
  
  // Split by comma and take the first genre, trim whitespace
  const firstGenre = genre.split(",")[0].trim();
  return firstGenre;
};

/**
 * Utility function to get all genres from a comma-separated list
 * @param genre - Genre string that might contain multiple genres separated by commas
 * @returns Array of genres
 */
export const getAllGenres = (genre: string | null | undefined): string[] => {
  if (!genre) return [];
  
  return genre.split(",").map(g => g.trim()).filter(g => g.length > 0);
};