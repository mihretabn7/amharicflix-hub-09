import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Star, Share2, Eye, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MovieRating from "@/components/MovieRating";
import MovieDetailsSection from "@/components/MovieDetailsSection";
import MovieReportModal from "@/components/MovieReportModal";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface Episode {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string;
    youtube_id: string;
    episode_number: number;
    watch_count: number | null;
    created_at: string;
    duration_minutes: number | null;
    genre: string | null;
    language: string | null;
    share_count: number | null;
    verified_report_count: number | null;
}

const SeriesDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [session, setSession] = useState<any>(null);
    const [viewStartTime, setViewStartTime] = useState<Date | null>(null);
    const [currentWatchDuration, setCurrentWatchDuration] = useState(0);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const { data: seriesData, isLoading } = useQuery({
        queryKey: ['series', id],
        queryFn: async () => {
            const [seriesResponse, episodesResponse, ratingsResponse] = await Promise.all([
                supabase
                    .from('movies')
                    .select('*')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('movies')
                    .select(`
                        id,
                        title,
                        description,
                        thumbnail_url,
                        youtube_id,
                        episode_number,
                        watch_count,
                        created_at,
                        duration_minutes,
                        genre,
                        language,
                        share_count,
                        verified_report_count
                    `)
                    .eq('series_id', id)
                    .order('episode_number', { ascending: true }),
                supabase
                    .from('movie_ratings')
                    .select('*')
                    .eq('movie_id', id)
            ]);

            if (seriesResponse.error) throw seriesResponse.error;
            if (!seriesResponse.data) {
                toast.error("Series not found");
                navigate('/series');
                throw new Error("Series not found");
            }

            return {
                series: seriesResponse.data,
                episodes: episodesResponse.data as Episode[],
                ratings: ratingsResponse.data || []
            };
        }
    });

    useEffect(() => {
        // Set first episode as current if none selected
        if (seriesData?.episodes && !currentEpisode) {
            setCurrentEpisode(seriesData.episodes[0]);
        }
    }, [seriesData?.episodes]);

    // Handle episode completion and auto-play next
    useEffect(() => {
        const handleVideoEnd = () => {
            if (seriesData?.episodes && currentEpisode) {
                const currentIndex = seriesData.episodes.findIndex(ep => ep.id === currentEpisode.id);
                if (currentIndex < seriesData.episodes.length - 1) {
                    setCurrentEpisode(seriesData.episodes[currentIndex + 1]);
                }
            }
        };

        // Listen for video end event
        const iframe = document.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('ended', handleVideoEnd);
            return () => iframe.removeEventListener('ended', handleVideoEnd);
        }
    }, [currentEpisode, seriesData?.episodes]);

    const handleShare = async () => {
        try {
            if (id) {
                await supabase.rpc('increment_movie_share_count', { movie_id: id });
            }

            const shareData = {
                title: seriesData?.series.title || 'Series',
                text: seriesData?.series.description || 'Check out this Ethiopian series!',
                url: window.location.href
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success('Shared successfully!');
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            } catch (clipboardError) {
                toast.error('Failed to share or copy link');
            }
        }
    };

    if (isLoading) {
        return <div className="min-h-screen pt-16 flex items-center justify-center">Loading...</div>;
    }

    if (!seriesData) {
        return <div className="min-h-screen pt-16">Error loading series details</div>;
    }

    const { series, episodes, ratings } = seriesData;
    const averageRating = ratings.length > 0
        ? ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratings.length
        : 0;

    return (
        <div className="min-h-screen pt-16">
            <div className="relative h-[70vh]">
                {isPlaying && currentEpisode ? (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow bg-black">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentEpisode.youtube_id}?autoplay=1`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        {session && (
                            <div className="bg-card p-4 border-t border-border space-y-6">
                                <MovieRating
                                    movieId={series.id}
                                    userId={session.user.id}
                                />
                                <div className="flex justify-end">
                                    <MovieReportModal
                                        movieId={series.id}
                                        userId={session.user.id}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${series.thumbnail_url})`
                            }}
                        >
                            <div className="hero-gradient" />
                        </div>
                        <div className="relative h-full flex items-center">
                            <div className="container mx-auto px-4">
                                <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                                    {series.title}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-6">
                                    <span>{new Date(series.created_at).getFullYear()}</span>
                                    <span>{series.genre || 'Genre pending'}</span>
                                    <span>{series.language || 'Amharic'}</span>
                                    <div className="flex items-center">
                                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                        <span>{averageRating.toFixed(1)}</span>
                                    </div>
                                    <span>{episodes.length} Episodes</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Button
                                        size="lg"
                                        className="bg-netflix-red hover:bg-netflix-red/90"
                                        onClick={() => setIsPlaying(true)}
                                    >
                                        <Play className="mr-2 h-5 w-5" /> Play Now
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={handleShare}>
                                        <Share2 className="mr-2 h-5 w-5" /> Share
                                    </Button>
                                    {session && (
                                        <MovieReportModal
                                            movieId={series.id}
                                            userId={session.user.id}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Episodes</CardTitle>
                                <CardDescription>
                                    {episodes.length} episodes available
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    {episodes.map((episode) => (
                                        <AccordionItem key={episode.id} value={episode.id}>
                                            <AccordionTrigger>
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={episode.thumbnail_url}
                                                            alt={episode.title}
                                                            className="w-24 h-16 object-cover rounded"
                                                        />
                                                        <div>
                                                            <h3 className="font-medium text-left">
                                                                Episode {episode.episode_number}: {episode.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {episode.watch_count || 0} views
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentEpisode(episode);
                                                            setIsPlaying(true);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <p className="text-muted-foreground">
                                                    {episode.description || 'No description available.'}
                                                </p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <MovieDetailsSection movie={series} userId={session?.user?.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeriesDetail; 