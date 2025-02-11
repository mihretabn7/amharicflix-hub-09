import React, { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { FiHome, FiMessageSquare, FiShoppingCart, FiSettings, FiUsers, FiFileText, FiBarChart, FiBell, FiSearch, FiMenu, FiX, FiDollarSign, FiActivity, FiClock } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function AdminDashboard() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'New user registration', time: '5 min ago' },
        { id: 2, message: 'Server update completed', time: '1 hour ago' },
        { id: 3, message: 'Database backup', time: '2 hours ago' }
    ]);

    const workingHours = [
        { time: '10:00 AM', duration: '2h 30m', project: 'UI Design' },
        { time: '1:00 PM', duration: '1h 45m', project: 'Backend Development' },
        { time: '3:30 PM', duration: '3h 15m', project: 'Testing' },
        { time: '5:00 PM', duration: '1h 30m', project: 'Documentation' }
    ];

    const recentActivities = [
        { user: 'John Doe', action: 'uploaded new video', time: '2 min ago', avatar: '👤' },
        { user: 'Jane Smith', action: 'commented on post', time: '15 min ago', avatar: '👤' },
        { user: 'Mike Johnson', action: 'created new account', time: '1 hour ago', avatar: '👤' }
    ];

    // Enhanced chart data
    const lineChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
            label: 'Total Sales',
            data: [47, 52, 48, 58, 45, 54, 47],
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.4
        }]
    };

    const barChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
            label: 'User Activity',
            data: [65, 59, 80, 81, 56],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
        }]
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard Overview', icon: <FiHome /> },
        { id: 'sales', label: 'Sales Analytics', icon: <FiDollarSign /> },
        { id: 'users', label: 'User Management', icon: <FiUsers /> },
        { id: 'activity', label: 'Activity Monitor', icon: <FiActivity /> },
        { id: 'reports', label: 'Reports', icon: <FiBarChart /> },
        { id: 'settings', label: 'Settings', icon: <FiSettings /> }
    ];

    const stats = {
        dashboard: [
            { title: 'Total Revenue', value: '$47,289', change: '+12%', icon: <FiDollarSign /> },
            { title: 'Active Users', value: '1,293', change: '+8%', icon: <FiUsers /> },
            { title: 'New Orders', value: '384', change: '+4%', icon: <FiShoppingCart /> },
            { title: 'Growth Rate', value: '29%', change: '+2%', icon: <FiActivity /> }
        ],
        sales: [
            { title: 'Daily Sales', value: '$3,456', change: '+5%', icon: <FiDollarSign /> },
            { title: 'Weekly Sales', value: '$23,789', change: '+7%', icon: <FiDollarSign /> },
            { title: 'Monthly Sales', value: '$98,456', change: '+15%', icon: <FiDollarSign /> },
            { title: 'Yearly Sales', value: '$1.2M', change: '+25%', icon: <FiDollarSign /> }
        ],
        users: [
            { title: 'New Users', value: '245', change: '+18%', icon: <FiUsers /> },
            { title: 'Active Users', value: '1,843', change: '+12%', icon: <FiUsers /> },
            { title: 'Premium Users', value: '432', change: '+9%', icon: <FiUsers /> },
            { title: 'Churn Rate', value: '2.3%', change: '-1%', icon: <FiUsers />, isNegative: true }
        ]
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardContent stats={stats.dashboard} />;
            case 'sales':
                return <SalesContent stats={stats.sales} />;
            case 'users':
                return <UsersContent stats={stats.users} />;
            default:
                return <div>Content for {activeSection}</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-white shadow-lg transition-all duration-300 fixed h-full z-30`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h1 className={`font-bold text-xl text-gray-800 ${!isSidebarOpen && 'hidden'}`}>
                        Admin Panel
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>

                <nav className="mt-6">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`
                                flex items-center py-3 px-4 cursor-pointer
                                ${activeSection === item.id ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}
                                transition-colors duration-200
                            `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            {isSidebarOpen && <span className="ml-4">{item.label}</span>}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

// Content Components
function DashboardContent({ stats }) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
            {/* Add your charts and other dashboard content here */}
        </div>
    );
}

function SalesContent({ stats }) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
            {/* Add sales specific charts and content here */}
        </div>
    );
}

function UsersContent({ stats }) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
            {/* Add user management specific content here */}
        </div>
    );
}

function StatCard({ title, value, change, icon, isNegative }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm text-gray-500">{title}</h4>
                <span className="text-gray-400">{icon}</span>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-semibold">{value}</div>
                    <div className={`text-sm ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                        {change}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard; 