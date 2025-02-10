import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLinkClick = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <nav className={`fixed w-full z-50 ${isScrolled ? 'bg-black' : 'bg-black'}`}>
            <div className="max-w-[1920px] mx-auto px-8">
                <div className="flex items-center justify-between h-[60px]">
                    {/* Left - Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={() => handleLinkClick('/')}
                            className="text-red-600 font-bold text-2xl"
                        >
                            አማርኛFlix
                        </button>
                    </div>

                    {/* Center - Main Navigation */}
                    <div className="hidden md:flex items-center space-x-7">
                        <button
                            onClick={() => handleLinkClick('/movies')}
                            className="text-[15px] text-gray-300 hover:text-gray-100 font-medium"
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => handleLinkClick('/series')}
                            className="text-[15px] text-gray-300 hover:text-gray-100 font-medium"
                        >
                            Series
                        </button>
                        <button
                            onClick={() => handleLinkClick('/categories')}
                            className="text-[15px] text-gray-300 hover:text-gray-100 font-medium"
                        >
                            Categories
                        </button>
                    </div>

                    {/* Right - Auth buttons */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handleLinkClick('/signin')}
                            className="text-[15px] text-gray-300 hover:text-gray-100 font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => handleLinkClick('/signup')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 text-[15px] font-medium rounded"
                        >
                            Sign Up
                        </button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-300 p-1"
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

                {/* Mobile menu */}
                <div
                    className={`${isOpen ? 'block' : 'hidden'
                        } md:hidden bg-black border-t border-gray-800`}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <button
                            onClick={() => handleLinkClick('/movies')}
                            className="block w-full text-left px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => handleLinkClick('/series')}
                            className="block w-full text-left px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Series
                        </button>
                        <button
                            onClick={() => handleLinkClick('/categories')}
                            className="block w-full text-left px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Categories
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation; 