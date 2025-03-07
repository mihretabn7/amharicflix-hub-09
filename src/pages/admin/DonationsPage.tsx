import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  donation_type: string;
  payment_status: string;
  payment_processor: string;
  transaction_id: string;
  created_at: string;
  completed_at: string;
}

export default function DonationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: donations, isLoading, isError } = useQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_donations')
        .select('id, user_id, amount, donation_type, payment_status, payment_processor, transaction_id, created_at, completed_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const columns: ColumnDef<Donation>[] = [
    {
      accessorKey: 'user_id',
      header: 'User ID'
    },
    {
      accessorKey: 'amount',
      header: 'Amount'
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment Status',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.payment_status}</span>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString()
    }
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading donations</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search donations..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      <DataTable columns={columns} data={donations || []} />
    </div>
  );
}
