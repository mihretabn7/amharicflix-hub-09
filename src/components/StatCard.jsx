function StatCard({ title, value, icon, change }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="text-gray-500">{title}</div>
                <div className="text-gray-600">{icon}</div>
            </div>
            <div className="text-2xl font-bold mb-2">{value}</div>
            <div className={`text-sm ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {change} from last month
            </div>
        </div>
    );
}

export default StatCard; 