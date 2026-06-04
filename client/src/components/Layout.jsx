import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { HiOutlineMenuAlt2, HiOutlineX } from 'react-icons/hi';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-white-950">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`${isMobile ? (mobileOpen ? 'block' : 'hidden') : 'block'}`}>
        <Sidebar
          isCollapsed={isMobile ? false : isCollapsed}
          setIsCollapsed={isMobile ? () => setMobileOpen(false) : setIsCollapsed}
        />
      </div>

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${isMobile ? 'ml-0' : isCollapsed ? 'ml-[72px]' : 'ml-64'
          }`}
      >
        {/* Top navigation bar */}
        <TopBar
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
