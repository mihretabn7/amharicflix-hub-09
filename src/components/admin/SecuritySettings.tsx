import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Key, AlertTriangle } from "lucide-react";
import type { SecuritySettings } from "@/types/security";

const SecuritySettings = () => {
    const [settings, setSettings] = useState<SecuritySettings>({
        id: 1, // Single row for global settings
        max_login_attempts: 5,
        require_phone_verification: true,
        auto_block_suspicious_ips: true,
        content_report_threshold: 5,
        updated_at: new Date().toISOString()
    });

    const handleSaveSettings = async () => {
        try {
            const { error } = await supabase
                .from('security_settings')
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success("Security settings updated successfully");
        } catch (error: any) {
            toast.error("Failed to update security settings");
        }
    };

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Authentication Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium">Maximum Login Attempts</label>
                            <p className="text-sm text-muted-foreground">
                                Number of failed attempts before account lockout
                            </p>
                        </div>
                        <Input
                            type="number"
                            value={settings.max_login_attempts}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    max_login_attempts: parseInt(e.target.value)
                                })
                            }
                            className="w-20"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium">Require Phone Verification</label>
                            <p className="text-sm text-muted-foreground">
                                Users must verify their phone number
                            </p>
                        </div>
                        <Switch
                            checked={settings.require_phone_verification}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    require_phone_verification: checked
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Measures
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium">Auto-block Suspicious IPs</label>
                            <p className="text-sm text-muted-foreground">
                                Automatically block suspicious IP addresses
                            </p>
                        </div>
                        <Switch
                            checked={settings.auto_block_suspicious_ips}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    auto_block_suspicious_ips: checked
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Content Moderation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium">Report Threshold</label>
                            <p className="text-sm text-muted-foreground">
                                Number of reports before content is automatically hidden
                            </p>
                        </div>
                        <Input
                            type="number"
                            value={settings.content_report_threshold}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    content_report_threshold: parseInt(e.target.value)
                                })
                            }
                            className="w-20"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                    Save Security Settings
                </Button>
            </div>
        </div>
    );
};

export default SecuritySettings;
