
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const countryCodeToFlag = (countryCode: string) => {
  // Convert country code to flag emoji
  if (!countryCode || countryCode === "Unknown") return "🏳️";
  
  // Country codes are two-letter ISO codes
  // Convert them to regional indicator symbols which create flag emojis
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

const countryCodeToName = (countryCode: string) => {
  // Map country codes to their full names
  const countryNames: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    GB: "United Kingdom",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    JP: "Japan",
    BR: "Brazil",
    IN: "India",
    CN: "China",
    RU: "Russia",
    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
    ET: "Ethiopia",
    EG: "Egypt",
    // Add more countries as needed
  };
  
  return countryNames[countryCode] || countryCode || "Unknown";
};

interface CountryViewsDisplayProps {
  countryViewsData?: any[];
  dateRange?: { from?: Date; to?: Date };
}

export function CountryViewsDisplay({ countryViewsData, dateRange }: CountryViewsDisplayProps = {}) {
  const { toast } = useToast();
  const startDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString() : undefined;

  const { data: countryData, isLoading, isError } = useQuery({
    queryKey: ["country-views", startDate, endDate],
    queryFn: async () => {
      try {
        const { data, error } = await customRpcs.getViewsByCountry(startDate, endDate);
        
        if (error) {
          console.error("Error fetching country views:", error);
          toast({
            title: "Error fetching country data",
            description: error.message,
            variant: "destructive"
          });
          return [];
        }
        
        console.log("Country views data:", data);
        return data || [];
      } catch (err) {
        console.error("Error in country views query:", err);
        return [];
      }
    },
    enabled: !countryViewsData // Only run this query if countryViewsData is not provided
  });

  // Use provided data or fetched data
  const dataToUse = countryViewsData || countryData || [];

  // Sort by total views and take top 10
  const sortedCountries = [...dataToUse]
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 10);
    
  // Calculate max views for progress bar scaling
  const maxViews = sortedCountries.length > 0 ? sortedCountries[0].total_views : 0;

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Viewing Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Error loading country data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Viewing Countries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !countryViewsData ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedCountries.length > 0 ? (
          <div className="space-y-4">
            {sortedCountries.map((country) => (
              <div key={country.country_code} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">
                      {countryCodeToFlag(country.country_code)}
                    </span>
                    <span className="font-medium">
                      {countryCodeToName(country.country_code)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {country.total_views.toLocaleString()} views
                  </span>
                </div>
                <Progress 
                  value={(country.total_views / maxViews) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>Registered: {country.registered_views.toLocaleString()}</span>
                  <span>Anonymous: {country.anonymous_views.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No country data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
