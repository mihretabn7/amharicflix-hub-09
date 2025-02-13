
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    date?: string;
}

export const StatCard = ({ title, value, change, icon, date }: StatCardProps) => {
    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
                        {date && (
                            <p className="text-xs text-muted-foreground mt-1">{date}</p>
                        )}
                    </div>
                    {icon}
                </div>
                {typeof change !== 'undefined' && (
                    <div className="mt-4">
                        <span
                            className={cn(
                                "text-xs font-medium",
                                change > 0 ? "text-green-500" : "text-red-500"
                            )}
                        >
                            {change > 0 ? "+" : ""}{change}%
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
