import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from "@/pages/admin/Dashboard";

// In your routes configuration
<Route path="/admin" element={<AdminDashboard />} />

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App; 