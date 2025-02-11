import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, Unlock, UserX, Search } from "lucide-react";
import type { User } from "@/types/user";

const UserManagement = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: users, refetch } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;

            return profiles.map(profile => ({
                ...profile,
                is_blocked: profile.is_blocked || false,
                last_sign_in_at: null // This will be updated when we implement sign-in tracking
            })) as User[];
        }
    });

    const handleBlockUser = async (userId: string, isBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: isBlocked })
                .eq('id', userId);

            if (error) throw error;

            toast.success(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`);
            refetch();
        } catch (error: any) {
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            toast.success('User deleted successfully');
            refetch();
        } catch (error: any) {
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users?.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email/Phone</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <div>{user.email}</div>
                                            {user.phone_number && (
                                                <div className="text-sm text-muted-foreground">
                                                    {user.phone_number}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {user.last_sign_in_at
                                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                                            : "Never"}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.is_blocked
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-green-50 text-green-700"
                                                }`}
                                        >
                                            {user.is_blocked ? "Blocked" : "Active"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                                            >
                                                {user.is_blocked ? (
                                                    <Unlock className="h-4 w-4" />
                                                ) : (
                                                    <Lock className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Delete User</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <p>Are you sure you want to delete this user?</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            This action cannot be undone. All user data will be permanently removed.
                                                        </p>
                                                        <div className="flex justify-end gap-4">
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserManagement;
