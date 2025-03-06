
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPin, Users } from "lucide-react";

export function CountryViewsDisplay() {
  const { data: countryViews, isLoading } = useQuery({
    queryKey: ['country-views'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_views_by_country');
      
      if (error) {
        console.error("Error fetching country views:", error);
        return [];
      }
      
      return data || [];
    }
  });

  const getCountryFlag = (countryCode: string) => {
    try {
      // For simplicity, we'll use emoji flags
      // Convert country code to regional indicator symbols
      if (countryCode.length !== 2) return '🌐';
      
      const offset = 127397;
      const firstChar = countryCode.charCodeAt(0) + offset;
      const secondChar = countryCode.charCodeAt(1) + offset;
      
      return String.fromCodePoint(firstChar, secondChar);
    } catch (e) {
      return '🌐';
    }
  };

  const totalViews = countryViews?.reduce((acc, country) => acc + country.total_views, 0) || 0;
  const registeredViews = countryViews?.reduce((acc, country) => acc + country.registered_views, 0) || 0;
  const anonymousViews = countryViews?.reduce((acc, country) => acc + country.anonymous_views, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Viewers by Country
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total Views</div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalViews}</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Registered Users</div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : registeredViews}</div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Anonymous Views</div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : anonymousViews}</div>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          ) : (
            <>
              {(countryViews || []).slice(0, 10).map((country, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="text-2xl">
                    {getCountryFlag(country.country_code)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{country.country_code}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" /> 
                      <span>{country.registered_views} registered</span>
                      <span className="text-xs">•</span>
                      <span>{country.anonymous_views} anonymous</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-primary bg-primary/10">
                    {country.total_views} views
                  </Badge>
                </div>
              ))}
              
              {(countryViews || []).length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No country data available
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
