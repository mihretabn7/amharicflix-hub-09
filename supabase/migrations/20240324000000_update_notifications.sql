-- Add is_sent column with default value false
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT false;

-- Migrate existing data: set is_sent to true for all existing notifications
UPDATE public.notifications 
SET is_sent = true 
WHERE is_sent IS NULL;

-- Drop the read column (after migrating the data)
ALTER TABLE public.notifications 
DROP COLUMN IF EXISTS read;

-- Ensure type column is text
ALTER TABLE public.notifications 
ALTER COLUMN type TYPE text USING type::text;

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for inserting notifications (admin only)
CREATE POLICY "Enable insert for admin users only" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    )
);

-- Policy for viewing notifications (admin can see all, users can see their own)
CREATE POLICY "Enable read access for users" ON public.notifications
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    )
);

-- Policy for deleting notifications (admin only)
CREATE POLICY "Enable delete for admin users only" ON public.notifications
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    )
);

-- Policy for updating notifications (admin only)
CREATE POLICY "Enable update for admin users only" ON public.notifications
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    )
); 