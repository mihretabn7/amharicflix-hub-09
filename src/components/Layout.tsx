import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationSystem from './NotificationSystem';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movie } from '@/types/movie';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

const Layout = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const navigate = useNavigate();

    const { data: searchResults } = useQuery({
        queryKey: ['global-search', showSearch],
        queryFn: async () => {
            if (!showSearch) return { movies: [], series: [] };

            const [moviesResponse, seriesResponse] = await Promise.all([
                supabase
                    .from('movies')
                    .select('*, movie_ratings(*)')
                    .eq('is_hidden', false)
                    .is('series_id', null),
                supabase
                    .from('movies')
                    .select('*, movie_ratings(*)')
                    .eq('is_hidden', false)
                    .not('series_id', 'is', null)
                    .order('series_id')
            ]);

            // Group series by series_id
            const uniqueSeries = seriesResponse.data ? 
                Array.from(new Set(seriesResponse.data.map(movie => movie.series_id)))
                .map(series_id => seriesResponse.data!.find(movie => movie.series_id === series_id))
                .filter((movie): movie is Movie => movie !== undefined) : [];

            return {
                movies: moviesResponse.data as Movie[] || [],
                series: uniqueSeries
            };
        },
        enabled: showSearch
    });

    const handleLinkClick = (path: string) => {
        setShowMobileMenu(false);
        navigate(path);
    };

    return (
        <>
            <NotificationSystem />

            <CommandDialog open={showSearch} onOpenChange={setShowSearch}>
                <CommandInput placeholder="Search movies and series..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {searchResults?.movies?.length > 0 && (
                        <CommandGroup heading="Movies">
                            {searchResults.movies.map((movie: Movie) => (
                                <CommandItem
                                    key={movie.id}
                                    onSelect={() => {
                                        navigate(`/movie/${movie.id}`);
                                        setShowSearch(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={movie.thumbnail_url}
                                            alt={movie.title}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                        <div>
                                            <div className="font-medium">{movie.title}</div>
                                            <div className="text-xs text-muted-foreground">{movie.genre}</div>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    {searchResults?.series?.length > 0 && (
                        <CommandGroup heading="Series">
                            {searchResults.series.map((series: Movie) => (
                                <CommandItem
                                    key={series.id}
                                    onSelect={() => {
                                        navigate(`/series/${series.id}`);
                                        setShowSearch(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={series.thumbnail_url}
                                            alt={series.title}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                        <div>
                                            <div className="font-medium">{series.title}</div>
                                            <div className="text-xs text-muted-foreground">{series.genre}</div>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>

            <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <Button
                        variant="ghost"
                        className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                    <div className="mr-4 hidden md:flex">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="font-bold">AmharicFlix</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link to="/" className="transition-colors hover:text-foreground/80">
                                Home
                            </Link>
                            <Link to="/movies" className="transition-colors hover:text-foreground/80">
                                Movies
                            </Link>
                            <Link to="/series" className="transition-colors hover:text-foreground/80">
                                Series
                            </Link>
                            <Link to="/profile" className="transition-colors hover:text-foreground/80">
                                Profile
                            </Link>
                        </nav>
                    </div>
                    <div className="flex-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={() => setShowSearch(true)}
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Mobile sidebar overlay */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`fixed top-14 bottom-0 z-50 w-3/4 bg-background md:hidden transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <nav className="space-y-2 p-4">
                    <a
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => handleLinkClick('/')}
                    >
                        Home
                    </a>
                    <a
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => handleLinkClick('/movies')}
                    >
                        Movies
                    </a>
                    <a
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => handleLinkClick('/series')}
                    >
                        Series
                    </a>
                    <a
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => handleLinkClick('/profile')}
                    >
                        Profile
                    </a>
                </nav>
            </div>

            {/* Main content */}
            <main>
                <Outlet />
            </main>
        </>
    );
};

export default Layout;
