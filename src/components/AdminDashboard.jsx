import {
    FaChartLine,
    FaUsers,
    FaShoppingCart,
    FaBars,
    FaTimes,
    FaChartPie,
    FaChartBar,
    FaBell
} from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function AdminDashboard() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [statistics, setStatistics] = useState({
        totalUsers: 1250,
        totalOrders: 856,
        revenue: 52640,
        activeUsers: 892
    });

    // Add loading states
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    // Add notification system
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'New order received', time: '5 min ago' },
        { id: 2, message: 'Server update completed', time: '1 hour ago' },
    ]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // On mobile, close sidebar when tab changes
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Sample data for charts
    const userGrowthData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'User Growth',
                data: [800, 950, 1100, 1250, 1400, 1550],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
    };

    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Monthly Revenue',
                data: [30000, 35000, 42000, 48000, 52000, 58000],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Enhanced Sidebar */}
            <div
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } transition-all duration-300 bg-gray-800 text-white fixed h-full z-30`}
            >
                <div className="p-4 flex justify-between items-center">
                    <h2 className={`${isSidebarOpen ? 'block' : 'hidden'} font-bold text-xl`}>Admin Panel</h2>
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <nav className="mt-6">
                    <SidebarItem
                        icon={<FaChartLine />}
                        text="Dashboard"
                        isOpen={isSidebarOpen}
                        active={activeTab === 'dashboard'}
                        onClick={() => handleTabChange('dashboard')}
                    />
                    <SidebarItem
                        icon={<FaUsers />}
                        text="Users"
                        isOpen={isSidebarOpen}
                        active={activeTab === 'users'}
                        onClick={() => handleTabChange('users')}
                    />
                    <SidebarItem
                        icon={<FaShoppingCart />}
                        text="Orders"
                        isOpen={isSidebarOpen}
                        active={activeTab === 'orders'}
                        onClick={() => handleTabChange('orders')}
                    />
                    <SidebarItem
                        icon={<FaChartPie />}
                        text="Analytics"
                        isOpen={isSidebarOpen}
                        active={activeTab === 'analytics'}
                        onClick={() => handleTabChange('analytics')}
                    />
                </nav>
            </div>

            {/* Main Content Area with proper sidebar offset */}
            <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    {/* Top Navigation Bar */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <div className="relative">
                                <button className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {notifications.length}
                                    </span>
                                    <FaBell className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <>
                            {/* Statistics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    title="Total Users"
                                    value={statistics.totalUsers}
                                    icon={<FaUsers />}
                                    change="+12%"
                                />
                                <StatCard
                                    title="Total Orders"
                                    value={statistics.totalOrders}
                                    icon={<FaShoppingCart />}
                                    change="+5%"
                                />
                                <StatCard
                                    title="Revenue"
                                    value={`$${statistics.revenue.toLocaleString()}`}
                                    icon={<FaChartLine />}
                                    change="+8%"
                                />
                                <StatCard
                                    title="Active Users"
                                    value={statistics.activeUsers}
                                    icon={<FaUsers />}
                                    change="+15%"
                                />
                            </div>

                            {/* Enhanced Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                                    <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                                    <Line data={userGrowthData} options={chartOptions} />
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                                    <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                                    <Bar data={revenueData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Recent Activity with enhanced styling */}
                            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                                    <button className="text-blue-500 hover:text-blue-700">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full table-auto">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Activity</th>
                                                <th className="px-6 py-3 text-left">User</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="px-6 py-4">2024-03-15</td>
                                                <td className="px-6 py-4">New Order</td>
                                                <td className="px-6 py-4">John Doe</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-6 py-4">2024-03-14</td>
                                                <td className="px-6 py-4">User Registration</td>
                                                <td className="px-6 py-4">Jane Smith</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">New</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard; 