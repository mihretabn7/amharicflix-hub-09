import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: number;
    subValue?: string;
    icon: React.ReactNode;
}

export function StatCard({ title, value, subValue, icon }: StatCardProps) {
    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    {icon}
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
