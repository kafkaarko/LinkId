import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

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
    <div data-theme="black" className="drawer bg-[#050505] text-white lg:drawer-open">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_20%),#050505]">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/65 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <label
              htmlFor="app-drawer"
              className="btn btn-ghost btn-sm rounded-2xl border border-white/10 bg-white/[0.04] font-normal text-white hover:border-white/20 hover:bg-white/[0.08]"
            >
              Menu
            </label>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                Active User
              </p>
              <p className="text-sm font-medium text-white">
                {user?.name ?? 'Guest'}
              </p>
            </div>
          </div>
        </div>

        <main className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <Sidebar />
    </div>
  );
}
