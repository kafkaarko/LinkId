import {
Routes,
Route,
Navigate
} from "react-router-dom";

import AppShell from "./components/AppShell";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

import ProtectedRoute from "./pages/ProtectedPage";
import GuestRoute from "./pages/GuestPage";



export default function App(){

return(
<AppShell>

<Routes>

<Route
path="/"
element={<HomePage/>}
/>

<Route
path="/login"
element={
<GuestRoute>
<LoginPage/>
</GuestRoute>
}
/>

<Route
path="/register"
element={
<GuestRoute>
<RegisterPage/>
</GuestRoute>
}
/>

<Route
path="/profile"
element={
<ProtectedRoute>
<ProfilePage/>
</ProtectedRoute>
}
/>

<Route
path="*"
element={<Navigate to="/" replace />}
/>

</Routes>

</AppShell>
)
}