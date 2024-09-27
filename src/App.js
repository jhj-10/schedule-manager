import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ScheduleFormPage from "./pages/ScheduleFormPage";
import { useContext } from "react";
import EditUserInfo from "./pages/EditUserInfo";
import "./App.css";
import AdminPage from "./pages/AdminPage";
import MainPage from "./pages/MainPage";

function App() {
  const END_POINT = "http://localhost:5000";

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route
            path="/schedule/write"
            element={
              <ProtectedRoute>
                <ScheduleFormPage endPoint={END_POINT} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/userinfo"
            element={
              <ProtectedRoute>
                <EditUserInfo endPoint={END_POINT} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage endPoint={END_POINT} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainPage endPoint={END_POINT} />
                {/* <CalendarPage /> */}
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
