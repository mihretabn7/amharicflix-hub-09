
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
}

export function CountryViewsDisplay({ countryViewsData }: CountryViewsDisplayProps = {}) {
  const { data: countryData, isLoading } = useQuery({
    queryKey: ["country-views"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_views_by_country');
      
      if (error) {
        console.error("Error fetching country views:", error);
        return [];
      }
      
      return data || [];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Viewing Countries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !countryViewsData ? (
          <div className="flex justify-center py-8">Loading country data...</div>
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
