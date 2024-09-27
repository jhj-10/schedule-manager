import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
import ScheduleFormPage from "./pages/ScheduleFormPage";
import { useContext } from "react";
import EditUserInfo from "./pages/EditUserInfo";
import "./App.css";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route
            path="/schedule/write"
            element={
              <ProtectedRoute>
                <ScheduleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/userinfo"
            element={
              <ProtectedRoute>
                <EditUserInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const LoginWrapper = () => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/" /> : <LoginPage />;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

export default App;
