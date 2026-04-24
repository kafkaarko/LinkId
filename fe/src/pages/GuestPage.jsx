import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute({ children }) {

 const { isAuthenticated, authLoading } = useAuth();

 if(authLoading) return null;

 return isAuthenticated
   ? <Navigate to="/profile" replace />
   : children;
}