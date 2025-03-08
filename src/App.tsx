
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Categories from "./pages/Categories";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import Series from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import { toast } from "sonner";
import Dashboard from "@/pages/admin/Dashboard";
import DashboardLayout from "@/components/admin/DashboardLayout";
import MovieManagement from "@/pages/admin/MovieManagement";
import UserManagement from "@/pages/admin/UserManagement";
import Reports from "@/pages/admin/Reports";
import Security from "@/pages/admin/Security";
import Settings from "@/pages/admin/Settings";
import Analytics from "@/pages/admin/Analytics";
import FeedbackPage from '@/pages/admin/FeedbackPage';
import DonationsPage from '@/pages/admin/DonationsPage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import MobileNavigation from "@/components/MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

// PWA installation detection and prompt
function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if on iOS
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIos(isIosDevice);

    // PWA install prompt listener (for Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('App installation started');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
    });
  };

  const generateAppDownloadLink = () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    // These would be your app store links in a real app
    const androidAppLink = "https://play.google.com/store/apps/details?id=app.lovable.amharicflix";
    const iosAppLink = "https://apps.apple.com/us/app/amharicflix/id1234567890";
    
    // Return download link based on platform
    if (isAndroid) return androidAppLink;
    if (isIOS) return iosAppLink;
    
    // Default to website
    return window.location.origin;
  };

  if (!showInstallButton) return null;

  return (
    <>
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="download-app-btn"
              size="icon"
            >
              <Download className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Install AmharicFlix</SheetTitle>
              <SheetDescription>
                {isIos ? (
                  <div className="space-y-4">
                    <p>To install AmharicFlix on your iOS device:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Tap the share button <span className="inline-block w-5 h-5 text-center rounded-md bg-gray-200">⬆️</span> at the bottom of the screen</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" in the top right corner</li>
                    </ol>
                    <p className="mt-4">You'll now have AmharicFlix as an app on your home screen!</p>
                    
                    <div className="mt-6">
                      <a 
                        href={generateAppDownloadLink()} 
                        className="app-download-btn w-full flex justify-center items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download from App Store
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>Install AmharicFlix to access it quickly and easily, even when offline.</p>
                    <div className="flex justify-center mt-4">
                      <Button onClick={handleInstallClick} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Install Now
                      </Button>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <p className="mb-4 text-sm text-center">Or download our native app</p>
                      <a 
                        href={generateAppDownloadLink()} 
                        className="app-download-btn w-full flex justify-center items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download from Play Store
                      </a>
                    </div>
                  </div>
                )}
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Install AmharicFlix</SheetTitle>
              <SheetDescription>
                {isIos ? (
                  <div className="space-y-4">
                    <p>To install AmharicFlix on your iOS device:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Tap the share button <span className="inline-block w-5 h-5 text-center rounded-md bg-gray-200">⬆️</span> at the bottom of the screen</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" in the top right corner</li>
                    </ol>
                    <p className="mt-4">You'll now have AmharicFlix as an app on your home screen!</p>
                    
                    <div className="mt-6">
                      <a 
                        href={generateAppDownloadLink()} 
                        className="app-download-btn w-full flex justify-center items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download from App Store
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>Install AmharicFlix to access it quickly and easily, even when offline.</p>
                    <div className="flex justify-center mt-4">
                      <Button onClick={handleInstallClick} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Install Now
                      </Button>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <p className="mb-4 text-sm text-center">Or download our native app</p>
                      <a 
                        href={generateAppDownloadLink()} 
                        className="app-download-btn w-full flex justify-center items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download from Play Store
                      </a>
                    </div>
                  </div>
                )}
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

function App() {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Initialize auth state first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Clear any stale auth data
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
      }
    }).catch((error) => {
      console.error("Error checking auth session:", error);
      toast.error("Error checking authentication status");
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === 'SIGNED_OUT') {
        // Clear auth data on sign out
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        toast.error("Session expired. Please sign in again.");
      } else if (event === 'SIGNED_IN') {
        if (!localStorage.getItem('signInSuccessShown')) {
          toast.success("Successfully signed in!");
          localStorage.setItem('signInSuccessShown', 'true');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
      }

      // Handle session recovery
      if (!session && event === 'INITIAL_SESSION') {
        try {
          const { error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
        } catch (error) {
          console.error("Error recovering session:", error);
          // Clear any potentially stale auth data
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.expires_at');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/admin/*" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<MovieManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="security" element={<Security />} />
            <Route path="settings" element={<Settings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="donations" element={<DonationsPage />} />
          </Route>
          <Route path="*" element={
            <>
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
              </Routes>
              {isMobile && <MobileNavigation />}
            </>
          } />
        </Routes>
        <PwaInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
