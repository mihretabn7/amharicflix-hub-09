import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLinkClick = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => handleLinkClick('/')}
                            className="text-white font-bold text-xl"
                        >
                            Your Brand
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                            aria-controls="mobile-menu"
                            aria-expanded={isOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            {/* Icon when menu is open */}
                            <svg
                                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        <button
                            onClick={() => handleLinkClick('/')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Home
                        </button>
                        <button
                            onClick={() => handleLinkClick('/admin')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`${isOpen ? 'block' : 'hidden'} md:hidden`}
                id="mobile-menu"
            >
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <button
                        onClick={() => handleLinkClick('/')}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                    >
                        Home
                    </button>
                    <button
                        onClick={() => handleLinkClick('/admin')}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                    >
                        Admin
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navigation; 