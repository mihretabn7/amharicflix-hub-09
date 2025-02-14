import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/utils/date-utils";

interface MovieReport {
  id: string;
  reason: string;
  created_at: string;
  status: string;
  movie: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
}

export const MovieReports = ({ reports }: { reports: MovieReport[] }) => {
  return (
    <div className="grid gap-4 mt-4">
      {reports?.map((report) => (
        <Link to={`/movie/${report.movie.id}`} key={report.id}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <img
                  src={report.movie.thumbnail_url}
                  alt={report.movie.title}
                  className="w-32 h-20 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium">{report.movie.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${report.status === "done"
                          ? "bg-green-500/10 text-green-500"
                          : report.status === "cancel"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                    >
                      {report.status === "done"
                        ? "Resolved"
                        : report.status === "cancel"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(report.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
