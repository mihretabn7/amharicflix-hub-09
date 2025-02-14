import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface DetailedListModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    data: Array<{
        title: string;
        count: number;
        suffix?: string;
    }>;
    renderItem: (item: { title: string; count: number; suffix?: string }, index: number) => React.ReactNode;
}

export function DetailedListModal({
    open,
    onOpenChange,
    title,
    data,
    renderItem,
}: DetailedListModalProps) {
    const [search, setSearch] = useState("");
    const filteredData = data.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col z-50">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="my-2"
                    />
                </DialogHeader>
                <ScrollArea className="flex-grow pr-4">
                    <div className="space-y-4 py-4">
                        {filteredData.map((item, index) => renderItem(item, index))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 