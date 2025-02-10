import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';

// Placeholder components (you can move these to separate files later)
const Home = () => <div className="text-white p-8">Home Page</div>;
const Movies = () => <div className="text-white p-8">Movies Page</div>;
const Series = () => <div className="text-white p-8">Series Page</div>;
const Categories = () => <div className="text-white p-8">Categories Page</div>;
const SignIn = () => <div className="text-white p-8">Sign In Page</div>;
const SignUp = () => <div className="text-white p-8">Sign Up Page</div>;

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-black">
                <Navigation />
                <div className="pt-16"> {/* Add padding to account for fixed navbar */}
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/movies" element={<Movies />} />
                        <Route path="/series" element={<Series />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App; 