import {
    Link,
    NavLink,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Sidebar() {


    const {
        isAuthenticated,
        user,
        logout
    } = useAuth();

    const navigate = useNavigate();

    const navigationItems = [
        { label: "Home", to: "/" },

        ...(isAuthenticated
            ? [{ label: "Profile", to: "/profile" }]
            : [
                { label: "Login", to: "/login" },
                { label: "Register", to: "/register" }
            ])
    ];
    
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="w-80 p-5">

            <ul className="menu gap-2">

                {navigationItems.map(item => (
                    <li key={item.to}>
                        <NavLink to={item.to}>
                            {item.label}
                        </NavLink>
                    </li>
                ))}

            </ul>

            <div className="mt-10">

                {isAuthenticated ? (
                    <>
                        <p>{user.name}</p>
                        <p>{user.email}</p>

                        <button
                            onClick={handleLogout}
                            className="btn btn-sm mt-4"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Link to="/login" className="btn">
                            Login
                        </Link>

                        <Link to="/register" className="btn">
                            Register
                        </Link>
                    </div>
                )}

            </div>

        </aside>
    )
}