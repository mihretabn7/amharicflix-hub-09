import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, Lock } from "lucide-react";

function Security() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Security & Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Shield className="h-5 w-5" />
                            <div>
                                <h3 className="font-medium">Two-Factor Authentication</h3>
                                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                            </div>
                        </div>
                        <Button variant="outline">Enable</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default Security; 