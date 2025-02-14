// Add this when tracking a view
const trackView = async (movieId: string) => {
    try {
        // Get user's IP and country
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        const { data, error } = await supabase.rpc('track_movie_view', {
            movie_id: movieId,
            user_ip: ip
        });

        if (error) console.error('View tracking error:', error);
    } catch (error) {
        console.error('IP detection failed:', error);
    }
}; 