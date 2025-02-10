function SidebarItem({ icon, text, isOpen, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200
                ${active
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
        >
            <span className="text-xl">{icon}</span>
            {isOpen && <span className="ml-4">{text}</span>}
        </button>
    );
}

export default SidebarItem; 