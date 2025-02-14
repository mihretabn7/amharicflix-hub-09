import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserActivity {
    id: string;
    email: string;
    totalWatchTime: number;
    moviesWatched: number;
    lastActive: string;
    joinedAt: string;
}

interface DailyStats {
    date: string;
    newUsers: number;
    activeUsers: number;
    totalWatches: number;
}

interface AdminSettings {
    // Content Settings
    max_movies_per_page: number;
    allow_movie_requests: boolean;
    enable_comments: boolean;
    enable_ratings: boolean;
    auto_approve_movies: boolean;

    // User Settings
    max_daily_uploads: number;
    require_email_verification: boolean;
    allow_user_registration: boolean;
    default_user_role: 'user' | 'moderator' | 'admin';

    // Moderation Settings
    report_threshold: number;
    content_moderation_enabled: boolean;
    auto_block_reported_content: boolean;

    // System Settings
    maintenance_mode: boolean;
    cache_duration: number;
    max_upload_size: number;
}

export default function Settings() {
    const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { data: settings, refetch, isLoading: queryIsLoading, error } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_settings')
                .select(`
                    max_movies_per_page,
                    allow_movie_requests,
                    enable_comments,
                    enable_ratings,
                    auto_approve_movies,
                    max_daily_uploads,
                    require_email_verification,
                    allow_user_registration,
                    default_user_role,
                    report_threshold,
                    content_moderation_enabled,
                    auto_block_reported_content,
                    maintenance_mode,
                    cache_duration,
                    max_upload_size
                `)
                .single();

            if (error) throw error;
            if (!data) throw new Error('No settings found');

            return data as unknown as AdminSettings;
        }
    });

    const updateSettings = useMutation({
        mutationFn: async (newSettings: Partial<AdminSettings>) => {
            console.log('Updating settings:', newSettings);

            const { data, error } = await supabase
                .from('admin_settings')
                .update(newSettings)
                .eq('id', 1)
                .select()
                .single();

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            console.log('Update successful:', data);
            toast.success("Settings updated successfully");
            refetch();
        },
        onError: (error) => {
            toast.error("Failed to update settings");
            console.error('Mutation error:', error);
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user activity
                const { data: users } = await supabase
                    .from('profiles')
                    .select('*');

                if (users) {
                    setUserActivity(users.map(user => ({
                        id: user.id,
                        email: user.email || '',
                        totalWatchTime: 0, // You'll need to calculate this
                        moviesWatched: 0, // You'll need to calculate this
                        lastActive: user.last_sign_in_at || '',
                        joinedAt: user.created_at || ''
                    })));
                }

                // Calculate daily stats
                // ... your existing daily stats calculation ...

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // Create a channel for realtime updates
        const channel = supabase
            .channel('admin-settings-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'admin_settings'
                },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [refetch]);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Platform Settings</h1>

            {isLoading && <div>Loading settings...</div>}
            {error && (
                <div className="text-red-500">
                    Error loading settings: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            )}

            {settings && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Content Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Movies Per Page</label>
                                <p className="text-sm text-muted-foreground">
                                    Number of movies displayed per page
                                </p>
                                <Input
                                    type="number"
                                    value={settings.max_movies_per_page}
                                    onChange={(e) => updateSettings.mutate({
                                        max_movies_per_page: parseInt(e.target.value)
                                    })}
                                    min={10}
                                    max={100}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Allow Movie Requests</label>
                                    <p className="text-sm text-muted-foreground">
                                        Users can request new movies
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.allow_movie_requests}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        allow_movie_requests: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Enable Comments</label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to comment on movies
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.enable_comments}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        enable_comments: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Enable Ratings</label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to rate movies
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.enable_ratings}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        enable_ratings: checked
                                    })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Max Daily Uploads</label>
                                <p className="text-sm text-muted-foreground">
                                    Maximum number of movies a user can upload per day
                                </p>
                                <Input
                                    type="number"
                                    value={settings.max_daily_uploads}
                                    onChange={(e) => updateSettings.mutate({
                                        max_daily_uploads: parseInt(e.target.value)
                                    })}
                                    min={0}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Email Verification</label>
                                    <p className="text-sm text-muted-foreground">
                                        Require email verification for new users
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.require_email_verification}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        require_email_verification: checked
                                    })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Default User Role</label>
                                <p className="text-sm text-muted-foreground">
                                    Role assigned to new users
                                </p>
                                <select
                                    value={settings.default_user_role}
                                    onChange={(e) => updateSettings.mutate({
                                        default_user_role: e.target.value as AdminSettings['default_user_role']
                                    })}
                                    className="w-full mt-2 rounded-md border p-2"
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Moderation Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Moderation Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Report Threshold</label>
                                <p className="text-sm text-muted-foreground">
                                    Number of reports before content is automatically hidden
                                </p>
                                <Input
                                    type="number"
                                    value={settings.report_threshold}
                                    onChange={(e) => updateSettings.mutate({
                                        report_threshold: parseInt(e.target.value)
                                    })}
                                    min={1}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Auto-block Reported Content</label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically hide content that reaches report threshold
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.auto_block_reported_content}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        auto_block_reported_content: checked
                                    })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>System Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Maintenance Mode</label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable maintenance mode (blocks user access)
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenance_mode}
                                    onCheckedChange={(checked) => updateSettings.mutate({
                                        maintenance_mode: checked
                                    })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Max Upload Size (MB)</label>
                                <p className="text-sm text-muted-foreground">
                                    Maximum file size for movie uploads
                                </p>
                                <Input
                                    type="number"
                                    value={settings.max_upload_size}
                                    onChange={(e) => updateSettings.mutate({
                                        max_upload_size: parseInt(e.target.value)
                                    })}
                                    min={100}
                                    className="mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
