import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-white font-bold text-xl">
                            አማርኛFlix
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/movies"
                            className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                            onClick={handleLinkClick}
                        >
                            Movies
                        </Link>
                        {/* ... other navigation links ... */}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation; 