import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLinkClick = () => {
        setShowMobileMenu(false);
    };

    return (
        <>
            <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {/* ... existing header content ... */}
            </header>

            {/* Mobile sidebar overlay */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`fixed top-16 bottom-0 z-50 w-3/4 bg-background md:hidden transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <nav className="space-y-2 p-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        onClick={handleLinkClick}
                    >
                        Home
                    </Link>
                    <Link
                        to="/movies"
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        onClick={handleLinkClick}
                    >
                        Movies
                    </Link>
                    {/* Add other navigation links with onClick={handleLinkClick} */}
                </nav>
            </div>

            {/* Main content */}
            <main>
                <Outlet />
            </main>
        </>
    );
};

export default Layout; 