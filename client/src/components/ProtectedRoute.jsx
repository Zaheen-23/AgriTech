
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HOME = {
  farmer: '/dashboard/farmer',
  buyer: '/dashboard/buyer',
  agriculturalist: '/dashboard/expert',
  admin: '/dashboard/admin'
};

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  console.log('Route check:', {
    user,
    role: user?.role,
    path: location.pathname
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || '').toLowerCase();

  if (allowedRoles) {
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    if (!allowed.includes(role)) {
      return <Navigate to={HOME[role] || '/'} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
