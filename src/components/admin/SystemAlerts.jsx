import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    Alert,
    AlertTitle,
} from '@mui/material';

export function SystemAlerts() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/admin/system-alerts');
                const data = await response.json();
                setAlerts(data);
            } catch (error) {
                console.error('Error fetching alerts:', error);
            }
        };
        fetchAlerts();
    }, []);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    System Alerts
                </Typography>
                <List>
                    {alerts.map((alert) => (
                        <ListItem key={alert.id}>
                            <Alert
                                severity={alert.severity}
                                sx={{ width: '100%' }}
                            >
                                <AlertTitle>{alert.title}</AlertTitle>
                                {alert.message}
                            </Alert>
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
} 