
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Categories from "./pages/Categories";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import Series from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import { toast } from "sonner";

function App() {
  useEffect(() => {
    // Initialize auth state first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Clear any stale auth data
        localStorage.removeItem('supabase.auth.token');
      }
    }).catch((error) => {
      console.error("Error checking auth session:", error);
      toast.error("Error checking authentication status");
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session) {
          // Clear any auth-related state or cached data
          localStorage.removeItem('supabase.auth.token');
        }
      }
      
      if (event === 'SIGNED_OUT') {
        toast.error("Session expired. Please sign in again.");
      } else if (event === 'SIGNED_IN') {
        toast.success("Successfully signed in!");
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:id" element={<SeriesDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
