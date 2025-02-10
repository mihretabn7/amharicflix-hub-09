
import { format } from "date-fns";

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
