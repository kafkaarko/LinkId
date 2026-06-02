
import AppRoutes from "./AppRoutes";
import LinkSkeleton from "./components/LinkSkeleton";
import { useAuth } from "./context/AuthContext";



export default function App() {
    const { authLoading } = useAuth();

  if (authLoading) {
    return <LinkSkeleton />;
  }

    return <AppRoutes />;

}