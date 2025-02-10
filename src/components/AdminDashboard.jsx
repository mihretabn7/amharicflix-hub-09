import {
    FaChartLine,
    FaUsers,
    FaShoppingCart,
    FaBars,
    FaTimes,
    FaChartPie,
    FaChartBar
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
    const [statistics, setStatistics] = useState({
        totalUsers: 1250,
        totalOrders: 856,
        revenue: 52640,
        activeUsers: 892
    });

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
            {/* Retractable Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-gray-800 text-white`}>
                <div className="p-4 flex justify-between items-center">
                    <h2 className={`${isSidebarOpen ? 'block' : 'hidden'} font-bold text-xl`}>Admin Panel</h2>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2">
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <nav className="mt-6">
                    {/* Sidebar navigation items */}
                    <SidebarItem icon={<FaChartLine />} text="Dashboard" isOpen={isSidebarOpen} />
                    <SidebarItem icon={<FaUsers />} text="Users" isOpen={isSidebarOpen} />
                    <SidebarItem icon={<FaShoppingCart />} text="Orders" isOpen={isSidebarOpen} />
                    <SidebarItem icon={<FaChartPie />} text="Analytics" isOpen={isSidebarOpen} />
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

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

                    {/* Analytics Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                            <Line data={userGrowthData} options={chartOptions} />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                            <Bar data={revenueData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Additional Reports Section */}
                    <div className="mt-8 bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
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
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard; 