// AdminRoute.js

import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthProvider";

const AdminRoute = () => {
  const { user } = useContext(AuthContext);

  return user && user.authority === "admin" ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
