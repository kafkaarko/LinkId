import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const closeDrawer = () => {
    const drawer = document.getElementById("app-drawer");
    if (drawer) drawer.checked = false;
  };

  const navigationItems = [
    { label: "Home", to: "/", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    ...(isAuthenticated
      ? [
          { label: "Profile", to: "/profile", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
          { label: "Analytics", to: "/analistic", icon: "M18 20V10M12 20V4M6 20v-6" },

        ]
      : [
          { label: "Login", to: "/login", icon: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" },
          { label: "Register", to: "/register", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19 8v6M22 11h-6" },
        ]),
  ];

  const handleLogout = () => {
    logout();
    closeDrawer();
    navigate("/login");
  };

  return (
    <div className="drawer-side z-50">
      {/* BACKDROP */}
      <label
        htmlFor="app-drawer"
        className="drawer-overlay !bg-black/60 "
      />

      <aside className="w-72 bg-[#0d0d0d] min-h-full">
        
        {/* BRAND */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-indigo-400">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Workspace
            </p>
            <h1 className="text-sm font-semibold text-white/90">
              LinkId
            </h1>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <p className="mb-3 px-3 text-[10px] uppercase tracking-[0.2em] text-white/25">
            Navigation
          </p>

          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-white/[0.07] text-white border border-white/[0.08]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={`h-4 w-4 ${isActive ? "text-indigo-400" : ""}`}
                  >
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* USER */}
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/15 text-xs font-semibold text-indigo-400">
                  {user?.name?.[0] ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/85">{user?.name}</p>
                  <p className="truncate text-xs text-white/35">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-sm text-white/50 hover:bg-white/[0.07] hover:text-white/80"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" onClick={closeDrawer} className="rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm text-white/70 text-center">
                Login
              </Link>
              <Link to="/register" onClick={closeDrawer} className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-sm text-indigo-400 text-center">
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}