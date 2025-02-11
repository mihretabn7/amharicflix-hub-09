import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export function DashboardCard({ title, value, icon, color }) {
    return (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {value.toLocaleString()}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}15`,
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {React.cloneElement(icon, { sx: { color: color, fontSize: 40 } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
} 