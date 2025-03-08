
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FeedbackStatus = 'new' | 'in_progress' | 'resolved';

interface Feedback {
  id: string;
  user_id: string;
  feedback_text: string;
  admin_response: string;
  status: FeedbackStatus;
  created_at: string;
}

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: feedback, isLoading, isError } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('id, user_id, feedback_text, admin_response, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    }
  });

  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: 'user_id',
      header: 'User ID'
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
      <DataTable columns={columns} data={feedback || []} />
    </div>
  );
}
