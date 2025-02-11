import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Container,
    Alert,
} from '@mui/material';
import {
    Movie as MovieIcon,
    Person as PersonIcon,
    Visibility as ViewsIcon,
    Share as ShareIcon,
} from '@mui/icons-material';
import { DashboardCard } from '../../components/admin/DashboardCard';
import { RecentMovies } from '../../components/admin/RecentMovies';
import { SystemAlerts } from '../../components/admin/SystemAlerts';

function Dashboard() {
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalUsers: 0,
        totalWatches: 0,
        totalShares: 0,
    });

    useEffect(() => {
        // Fetch dashboard statistics
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <Container maxWidth="lg">
            <Box py={4}>
                <Typography variant="h4" gutterBottom>
                    Dashboard Overview
                </Typography>

                <Grid container spacing={3}>
                    {/* Quick Stats Cards */}
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Total Movies"
                            value={stats.totalMovies}
                            icon={<MovieIcon />}
                            color="#1976d2"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={<PersonIcon />}
                            color="#2e7d32"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Total Watches"
                            value={stats.totalWatches}
                            icon={<ViewsIcon />}
                            color="#ed6c02"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Total Shares"
                            value={stats.totalShares}
                            icon={<ShareIcon />}
                            color="#9c27b0"
                        />
                    </Grid>

                    {/* Recent Movies Section */}
                    <Grid item xs={12} md={8}>
                        <RecentMovies />
                    </Grid>

                    {/* System Alerts Section */}
                    <Grid item xs={12} md={4}>
                        <SystemAlerts />
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

export default Dashboard; 