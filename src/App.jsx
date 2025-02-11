import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
// ... other imports

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Navigation />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    {/* ... other routes */}
                </Routes>
            </div>
        </Router>
    );
}

export default App; 