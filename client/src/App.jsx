
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import Login from './pages/Login';
import SignUp from './pages/SignUp';

import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import AdminDashboard from './pages/AdminDashboard';

import CropMonitoring from './pages/CropMonitoring';
import Farms from './pages/Farms';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import Experts from './pages/Experts';
import PestManagement from './pages/PestManagement';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Weather from './pages/Weather';
import MyCrops from './pages/MyCrops';
import SoilAnalysis from './pages/SoilAnalysis';

import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';

// Landing Page
function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🌾',
      title: 'For Farmers',
      description:
        'Monitor crops, analyze soil, manage pests, and make smarter farming decisions.',
    },
    {
      icon: '🛒',
      title: 'For Buyers & Exporters',
      description:
        'Explore agricultural products, place orders, and connect with farmers.',
    },
    {
      icon: '👨‍🌾',
      title: 'For Agricultural Experts',
      description:
        'Share agricultural knowledge, help farmers, and provide expert guidance.',
    },
  ];

  return (
    <div
      className="min-vh-100 text-light"
      style={{
        background:
          'linear-gradient(135deg, #102d1b, #1b5e20 50%, #07180d)',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <nav className="navbar navbar-expand-lg navbar-dark px-3 px-md-5 py-3">
        <Link
          className="navbar-brand fw-bold fs-4"
          to="/"
          style={{ color: '#b9f6ca' }}
        >
          🌱 AgriTech Ecosystem
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
            <a className="nav-link" href="#home">
              Home
            </a>

            <a className="nav-link" href="#features">
              Features
            </a>

            <Link className="nav-link" to="/login">
              Login
            </Link>

            <Link
              className="btn btn-success rounded-pill px-4"
              to="/signup"
            >
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      <section
        id="home"
        className="container py-5 text-center"
        style={{ minHeight: '55vh' }}
      >
        <div className="row justify-content-center align-items-center py-5">
          <div className="col-lg-9">
            <div className="display-3 fw-bold mb-4">
              Growing a Smarter Agricultural Future
            </div>

            <p className="lead mb-4 text-light">
              Connecting farmers, buyers, and agricultural experts
              through technology, AI, and innovation.
            </p>

            <div className="d-flex justify-content-center flex-wrap gap-3">
              <button
                className="btn btn-success btn-lg rounded-pill px-5"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </button>

              <button
                className="btn btn-outline-light btn-lg rounded-pill px-5"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">
            One Platform, Multiple Solutions
          </h2>

          <p className="text-light">
            Tools and services designed for the agricultural ecosystem.
          </p>
        </div>

        <div className="row g-4">
          {features.map((feature) => (
            <div className="col-md-4" key={feature.title}>
              <div
                className="card h-100 border-0 rounded-4 p-4 text-light"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    'translateY(-5px)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="display-4 mb-3">{feature.icon}</div>

                <h4 className="fw-bold mb-3">{feature.title}</h4>

                <p className="mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container text-center py-5">
        <h2 className="fw-bold mb-3">
          Ready to grow with AgriTech?
        </h2>

        <p className="text-light mb-4">
          Join the platform and explore smarter agricultural solutions.
        </p>

        <button
          className="btn btn-success btn-lg rounded-pill px-5"
          onClick={() => navigate('/signup')}
        >
          Join Now
        </button>
      </section>

      <footer
        className="text-center py-4 mt-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        🌱 AgriTech Ecosystem · Growing Together
      </footer>
    </div>
  );
}

// Role-based route access
const farmerOnly = ['farmer'];
const buyerOnly = ['buyer'];
const expertOnly = ['expert', 'agriculturalist'];
const adminOnly = ['admin'];

const commonAccess = [
  'farmer',
  'buyer',
  'expert',
  'agriculturalist',
];

const farmerBuyerAccess = ['farmer', 'buyer'];

const farmerExpertAccess = [
  'farmer',
  'expert',
  'agriculturalist',
];

const authenticatedOnly = [
  'farmer',
  'buyer',
  'expert',
  'agriculturalist',
  'admin',
];

// Main App
function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin dashboard */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={adminOnly}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Farmer dashboard */}
          <Route
            path="/dashboard/farmer"
            element={
              <ProtectedRoute allowedRoles={farmerOnly}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Buyer dashboard */}
          <Route
            path="/dashboard/buyer"
            element={
              <ProtectedRoute allowedRoles={buyerOnly}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Expert dashboard */}
          <Route
            path="/dashboard/expert"
            element={
              <ProtectedRoute allowedRoles={expertOnly}>
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />

          {/* Farmer-only pages */}
          <Route
            path="/farms"
            element={
              <ProtectedRoute allowedRoles={farmerOnly}>
                <Farms />
              </ProtectedRoute>
            }
          />

          {/* Soil Analysis: one route only */}
          <Route
            path="/soil"
            element={
              <ProtectedRoute allowedRoles={farmerOnly}>
                <SoilAnalysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/crops"
            element={
              <ProtectedRoute allowedRoles={farmerOnly}>
                <MyCrops />
              </ProtectedRoute>
            }
          />

          {/* Crop monitoring */}
          <Route
            path="/crop-monitoring"
            element={
              <ProtectedRoute allowedRoles={farmerOnly}>
                <CropMonitoring />
              </ProtectedRoute>
            }
          />

          {/* Weather: Farmer, Buyer, Expert */}
          <Route
            path="/weather"
            element={
              <ProtectedRoute allowedRoles={commonAccess}>
                <Weather />
              </ProtectedRoute>
            }
          />

          {/* Pest management: Farmer, Expert */}
          <Route
            path="/pest-management"
            element={
              <ProtectedRoute allowedRoles={farmerExpertAccess}>
                <PestManagement />
              </ProtectedRoute>
            }
          />

          {/* Shop: Farmer, Buyer, Expert */}
          <Route
            path="/shop"
            element={
              <ProtectedRoute allowedRoles={commonAccess}>
                <Shop />
              </ProtectedRoute>
            }
          />

          {/* Orders: Farmer, Buyer, Expert */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={commonAccess}>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Expert directory: Farmer, Buyer */}
          <Route
            path="/experts"
            element={
              <ProtectedRoute allowedRoles={farmerBuyerAccess}>
                <Experts />
              </ProtectedRoute>
            }
          />

          {/* Community: Farmer, Buyer, Expert */}
          <Route
            path="/community"
            element={
              <ProtectedRoute allowedRoles={commonAccess}>
                <Community />
              </ProtectedRoute>
            }
          />

          {/* Profile: all authenticated roles */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={authenticatedOnly}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;