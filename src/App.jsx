import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from "@/pages/admin/Dashboard";

// In your routes configuration
<Route path="/admin" element={<AdminDashboard />} />

function App() {
    return (
        <Router>
            <div>
                <Navigation />
                <Routes>
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* Add other routes as needed */}
                </Routes>
            </div>
        </Router>
    );
}

export default App; 