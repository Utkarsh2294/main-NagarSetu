import { Navigate } from "react-router-dom";
import { getStoredAdmin } from "./api";

// Guard for any /admin/* page except login. Mirrors how App.jsx checks
// `currentUser` for citizen routes, but against the stored admin session.
export default function AdminRoute({ children }) {
  const admin = getStoredAdmin();
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}
