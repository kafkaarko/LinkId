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
import LinkAnalytics from "./pages/Analistic";
import RedirectPage from "./pages/RedirectPage";
import AnalisticDetail from "./pages/AnalisticDetail";



export default function App() {
  return (
    <Routes>

      {/* 🔥 ROUTE TANPA SIDEBAR */}
      <Route path="/:slug" element={<RedirectPage />} />

      {/* 🔥 ROUTE DENGAN SIDEBAR */}
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analistic"
          element={
            <ProtectedRoute>
              <LinkAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analistic/:slug"
          element={
            <ProtectedRoute>
              <AnalisticDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}