function SidebarItem({ icon, text, isOpen }) {
    return (
        <a
            href="#"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
            <span className="text-xl">{icon}</span>
            {isOpen && <span className="ml-4">{text}</span>}
        </a>
    );
}

export default SidebarItem; 