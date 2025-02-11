import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Box,
} from '@mui/material';

export function RecentMovies() {
    const [recentMovies, setRecentMovies] = useState([]);

    useEffect(() => {
        const fetchRecentMovies = async () => {
            try {
                const response = await fetch('/api/admin/recent-movies');
                const data = await response.json();
                setRecentMovies(data);
            } catch (error) {
                console.error('Error fetching recent movies:', error);
            }
        };
        fetchRecentMovies();
    }, []);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Recently Added Movies
                </Typography>
                <List>
                    {recentMovies.map((movie) => (
                        <ListItem key={movie.id} divider>
                            <ListItemAvatar>
                                <Avatar src={movie.thumbnail} alt={movie.title} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={movie.title}
                                secondary={
                                    <Box component="span">
                                        <Typography component="span" variant="body2" color="textSecondary">
                                            {movie.genre} • {movie.language} • Added {new Date(movie.uploadDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
} 