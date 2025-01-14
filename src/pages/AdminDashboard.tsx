import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Film, Users, MessageSquare, Settings } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button className="bg-netflix-red hover:bg-netflix-red/90">
            Add New Movie
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Movies</p>
                <h3 className="text-2xl font-bold">125</h3>
              </div>
              <Film className="h-8 w-8 text-netflix-red" />
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <h3 className="text-2xl font-bold">1,234</h3>
              </div>
              <Users className="h-8 w-8 text-netflix-gold" />
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Comments</p>
                <h3 className="text-2xl font-bold">543</h3>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Categories</p>
                <h3 className="text-2xl font-bold">8</h3>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-6">Add New Movie</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input className="bg-secondary" placeholder="Movie title" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <Input className="bg-secondary" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input className="bg-secondary" placeholder="Drama, Comedy, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Release Year</label>
                <Input className="bg-secondary" type="number" placeholder="2024" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea className="bg-secondary" placeholder="Movie description..." />
              </div>
            </div>
            <Button className="bg-netflix-red hover:bg-netflix-red/90">
              Add Movie
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;