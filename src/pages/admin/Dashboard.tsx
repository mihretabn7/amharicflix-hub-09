import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MovieTable from "@/components/MovieTable";
import ReportManagement from "@/components/ReportManagement";
import AdminStats from "@/components/AdminStats";

const Dashboard = () => {
    return (
        <div className="min-h-screen pt-24">
            <div className="container mx-auto px-4">
                <div className="space-y-8">
                    <AdminStats />

                    <Tabs defaultValue="movies">
                        <TabsList>
                            <TabsTrigger value="movies">Movies</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>
                        <TabsContent value="movies">
                            <MovieTable />
                        </TabsContent>
                        <TabsContent value="reports">
                            <ReportManagement />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 