import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

interface UserActivity {
    id: string;
    email: string;
    totalWatchTime: number;
    moviesWatched: number;
    lastActive: string;
    joinedAt: string;
}

export const columns: ColumnDef<UserActivity>[] = [
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "moviesWatched",
        header: "Movies Watched",
    },
    {
        accessorKey: "totalWatchTime",
        header: "Total Watch Time",
        cell: ({ row }) => {
            const minutes = row.getValue("totalWatchTime") as number;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        },
    },
    {
        accessorKey: "lastActive",
        header: "Last Active",
        cell: ({ row }) => {
            const date = row.getValue("lastActive") as string;
            return date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "Never";
        },
    },
    {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => {
            const date = row.getValue("joinedAt") as string;
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        },
    },
]; 