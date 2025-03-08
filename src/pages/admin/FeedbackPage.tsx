
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { supabase, customRpcs } from '@/integrations/supabase/client';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Update the interface to match the structure returned by getAllFeedbackWithUsers
interface Feedback {
  id: string;
  feedback_text: string;
  admin_response: string | null;
  status: string;
  created_at: string;
  user: {
    username: string | null;
    email: string | null;
  };
}

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: feedback, isLoading, isError } = useQuery({
    queryKey: ['feedback-with-users'],
    queryFn: async () => {
      // Use the custom RPC function to get feedback with user details
      const { data, error } = await customRpcs.getAllFeedbackWithUsers();
      
      if (error) throw error;
      return data;
    }
  });

  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? (user.username || user.email || 'Anonymous') : 'Unknown';
      }
    },
    {
      accessorKey: 'feedback_text',
      header: 'Feedback Text'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString()
    }
  ];

  // Filter the feedback based on search query and status filter
  const filteredFeedback = feedback?.filter(item => {
    const matchesSearch = 
      searchQuery === '' || 
      item.feedback_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      <DataTable columns={columns} data={filteredFeedback} />
    </div>
  );
}
