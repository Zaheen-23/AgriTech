import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HOME = {
  farmer: '/dashboard/farmer',
  buyer: '/dashboard/buyer',
  agriculturalist: '/dashboard/expert',
  admin: '/dashboard/admin'
};

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  console.log("Route check:", {
  user,
  role: user?.role,
  path: window.location.pathname
});
  console.log("ProtectedRoute user:", user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    const role = String(user.role).toLowerCase();

    if (!allowed.includes(role)) {
      return <Navigate to={HOME[role] || '/'} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
