import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

export default function ProtectedRoute({ rolesAllowed = [] }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="p-4">
        <Loader variant="dots" size={16} />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;

  if (rolesAllowed.length > 0 && !rolesAllowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
