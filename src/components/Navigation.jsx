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
                        <Link
                            to="/series"
                            className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                            onClick={handleLinkClick}
                        >
                            Series
                        </Link>
                        <Link
                            to="/categories"
                            className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                            onClick={handleLinkClick}
                        >
                            Categories
                        </Link>
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/admin"
                            className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium hidden md:block"
                            onClick={handleLinkClick}
                        >
                            Admin
                        </Link>
                        <Link
                            to="/signin"
                            className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                            onClick={handleLinkClick}
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            onClick={handleLinkClick}
                        >
                            Sign Up
                        </Link>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-300 hover:text-white p-2"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {isOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <Link
                        to="/movies"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        onClick={handleLinkClick}
                    >
                        Movies
                    </Link>
                    <Link
                        to="/series"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        onClick={handleLinkClick}
                    >
                        Series
                    </Link>
                    <Link
                        to="/categories"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        onClick={handleLinkClick}
                    >
                        Categories
                    </Link>
                    <Link
                        to="/admin"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        onClick={handleLinkClick}
                    >
                        Admin
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navigation; 