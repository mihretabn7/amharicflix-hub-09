import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <div className={`md:flex md:items-center ${isOpen ? 'block' : 'hidden'}`}>
            <Link
                to="/"
                className="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-300 mr-6"
                onClick={handleLinkClick}
            >
                Home
            </Link>
            <Link
                to="/admin"
                className="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-300"
                onClick={handleLinkClick}
            >
                Admin
            </Link>
        </div>
    );
}

export default Navigation; 