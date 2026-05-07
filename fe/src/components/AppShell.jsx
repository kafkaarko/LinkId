import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Outlet } from "react-router-dom";

export default function AppShell({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const drawer = document.getElementById('app-drawer');
    if (drawer) {
      drawer.checked = false;
    }
  }, [location.pathname]);

  return (
    <div data-theme="black" className="drawer bg-[#0a0a0a] text-white lg:drawer-open">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content */}
      <div className="drawer-content min-h-screen"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.08), transparent), #0a0a0a'
        }}
      >
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <label
              htmlFor="app-drawer"
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.07] cursor-pointer"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Menu
            </label>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Signed in as</p>
              <p className="text-sm font-medium text-white/80">{user?.name ?? 'Guest'}</p>
            </div>
          </div>
        </div>

        <main className="px-4 py-5 md:px-6 md:py-7 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl"><Outlet /></div>
        </main>
      </div>

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
}