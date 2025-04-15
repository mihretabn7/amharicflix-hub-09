import { format } from "date-fns";
import { subDays, subMonths, subWeeks, subYears } from "date-fns";

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM yyyy');
  } catch (error) {
    return 'N/A';
  }
};

export const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'PPp');
  } catch (error) {
    return 'N/A';
  }
};

export const getStartDate = (timeRange: "daily" | "weekly" | "monthly" | "yearly") => {
  const now = new Date();
  switch (timeRange) {
    case "daily":
      return subDays(now, 1);
    case "weekly":
      return subWeeks(now, 1);
    case "monthly":
      return subMonths(now, 1);
    case "yearly":
      return subYears(now, 1);
    default:
      return now;
  }
};
