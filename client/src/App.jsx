
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
import AICropDoctorPage from './pages/AICropDoctorPage';
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
      icon: '🌱',
      title: 'Crop Monitoring',
      description:
        'Keep your crops happy and healthy with smarter monitoring.',
      color: '#e5f2dc',
      tag: 'GROW BETTER'
    },
    {
      icon: '🌼',
      title: 'Soil Analysis',
      description:
        'Get to know your soil and give every plant a better start.',
      color: '#ffe7a3',
      tag: 'KNOW YOUR SOIL'
    },
    {
      icon: '☀️',
      title: 'Weather Forecast',
      description:
        'Stay one step ahead with useful weather information.',
      color: '#dceef9',
      tag: 'PLAN AHEAD'
    },
    {
      icon: '🧺',
      title: 'Farm Marketplace',
      description:
        'Discover agricultural products and connect with buyers.',
      color: '#ffddd0',
      tag: 'SHOP & CONNECT'
    }
  ];

  return (
    <div
      style={{
        background: '#fffaf0',
        color: '#254734',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
        minHeight: '100vh'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .lp-nav {
          background: #fffaf0;
          border-bottom: 1px solid #eee8d9;
        }

        .lp-brand {
          color: #174c38 !important;
          font-weight: 800;
          letter-spacing: -1px;
          font-size: 24px;
        }

        .lp-link {
          color: #365542 !important;
          font-weight: 600;
        }

        .lp-link:hover {
          color: #80a83f !important;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 23px;
          border-radius: 50px;
          border: 2px solid #176b45;
          background: #176b45;
          color: white;
          font-weight: 700;
          text-decoration: none;
          transition: all .25s ease;
        }

        .lp-btn:hover {
          background: #124d2b;
          border-color: #124d2b;
          color: white;
          transform: translateY(-2px);
        }

        .lp-btn-light {
          background: transparent;
          color: #176b45;
          border-color: #c8d9c5;
        }

        .lp-btn-light:hover {
          background: #e5f2dc;
          color: #174c38;
          border-color: #e5f2dc;
        }

        .lp-script {
          font-family: 'Caveat', cursive;
          color: #7da43e;
          font-size: 30px;
          font-weight: 700;
        }

        .lp-title {
          font-size: clamp(42px, 5.5vw, 72px);
          line-height: 1.05;
          letter-spacing: -3px;
          font-weight: 800;
          color: #174c38;
        }

        .lp-title span {
          color: #80a83f;
        }

        .lp-description {
          max-width: 510px;
          color: #68796b;
          font-size: 16px;
          line-height: 1.9;
        }

        .lp-hero-image {
          display: block;
          width: 100%;
          height: 450px;
          object-fit: cover;
          border: 8px solid white;
          border-radius: 48% 48% 28px 28px;
          box-shadow: 0 18px 45px #29483b18;
        }

        .lp-photo-note {
          position: absolute;
          bottom: 20px;
          left: -18px;
          background: white;
          border-radius: 18px;
          padding: 15px 18px;
          box-shadow: 0 10px 35px #29483b20;
          font-size: 13px;
        }

        .lp-feature {
          height: 100%;
          padding: 25px;
          border-radius: 26px;
          border: 2px solid white;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .lp-feature:hover {
          transform: translateY(-7px);
          box-shadow: 0 15px 35px #29483b13;
        }

        .lp-feature-icon {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: #ffffffb8;
          font-size: 30px;
          margin-bottom: 20px;
        }

        .lp-feature-tag {
          display: inline-block;
          margin-bottom: 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #526c50;
        }

        .lp-feature h3 {
          color: #254734;
          font-size: 20px;
          font-weight: 800;
        }

        .lp-feature p {
          color: #617267;
          font-size: 14px;
          line-height: 1.8;
        }

        .lp-step {
          padding: 24px;
          height: 100%;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e7ecdf;
        }

        .lp-step-num {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          margin-bottom: 17px;
          border-radius: 50%;
          background: #dceccf;
          color: #24523a;
          font-weight: 800;
        }

        .lp-cta {
          padding: 48px;
          border-radius: 32px;
          color: white;
          background: #174c38;
        }

        .lp-cta h2 {
          color: white;
          font-family: 'Caveat', cursive;
          font-size: clamp(42px, 5vw, 62px);
          font-weight: 700;
        }

        .lp-footer {
          border-top: 1px solid #eee8d9;
          color: #718073;
        }

        @media (max-width: 767px) {
          .lp-title {
            letter-spacing: -1.5px;
          }

          .lp-hero-image {
            height: 320px;
          }

          .lp-photo-note {
            left: 0;
          }

          .lp-cta {
            padding: 28px 22px;
          }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg lp-nav px-3 px-md-5 py-3">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand lp-brand">
            🌿 Agri<span style={{ color: '#80a83f' }}>Tech</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#agriNavbar"
            aria-controls="agriNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ borderColor: '#c8d9c5' }}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="agriNavbar">
            <div className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
              <a href="#home" className="nav-link lp-link">Home</a>
              <a href="#features" className="nav-link lp-link">Explore</a>
              <a href="#about" className="nav-link lp-link">Our Story</a>
              <Link to="/login" className="nav-link lp-link">Login</Link>
              <Link to="/signup" className="lp-btn">
                Get Started ↗
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section id="home" style={{ padding: '65px 0 75px' }}>
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <div className="lp-script mb-2">
                  A little greener, every day ✿
                </div>

                <h1 className="lp-title mb-4">
                  Growing a <span>brighter</span> future, naturally.
                </h1>

                <p className="lp-description mb-4">
                  Where good old farming meets a little smart technology.
                  Grow healthier crops, make informed decisions, and
                  connect with a community that grows together.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <button
                    className="lp-btn"
                    onClick={() => navigate('/signup')}
                  >
                    Let's Get Growing ↗
                  </button>

                  <a href="#features" className="lp-btn lp-btn-light">
                    Explore Features
                  </a>
                </div>

                <div
                  className="mt-4"
                  style={{ color: '#738273', fontSize: '13px' }}
                >
                  🌱 For farmers, buyers & agricultural experts
                </div>

                <div className="lp-script mt-4">
                  Little steps make big things grow!
                </div>
              </div>

              <div className="col-lg-6">
                <div className="position-relative px-2">
                  <img
                    className="lp-hero-image"
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85"
                    alt="Beautiful green agricultural fields"
                  />

                  <div className="lp-photo-note">
                    <div className="fw-bold">🌻 Grow with nature</div>
                    <div style={{ color: '#718073' }}>
                      Better choices, greener tomorrows
                    </div>
                  </div>
                </div>

                <div className="text-end lp-script mt-3">
                  Made to help things bloom ☀
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" style={{ padding: '60px 0' }}>
          <div className="container">
            <div className="text-center mb-5">
              <div className="lp-script">Your little farming toolkit ✿</div>

              <h2
                style={{
                  color: '#174c38',
                  fontSize: 'clamp(30px, 4vw, 46px)',
                  fontWeight: 800,
                  letterSpacing: '-1.5px'
                }}
              >
                Little tools. Big possibilities.
              </h2>

              <p className="lp-description mx-auto mt-3">
                Thoughtful tools for your everyday farming journey.
                Everything you need, all in one happy little place.
              </p>
            </div>

            <div className="row g-4">
              {features.map((feature) => (
                <div className="col-sm-6 col-lg-3" key={feature.title}>
                  <div
                    className="lp-feature"
                    style={{ background: feature.color }}
                  >
                    <div className="lp-feature-icon">{feature.icon}</div>
                    <div className="lp-feature-tag">{feature.tag}</div>
                    <h3 className="mb-3">{feature.title}</h3>
                    <p className="mb-0">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" style={{ padding: '35px 0 70px' }}>
          <div className="container">
            <div className="text-center mb-5">
              <div className="lp-script">Easy as one, two, three! 🌷</div>
              <h2
                style={{
                  color: '#174c38',
                  fontSize: 'clamp(30px, 4vw, 44px)',
                  fontWeight: 800
                }}
              >
                How it works
              </h2>
            </div>

            <div className="row g-4">
              {[
                {
                  number: '01',
                  icon: '🌻',
                  title: 'Join the community',
                  text: 'Create your account and choose your role.'
                },
                {
                  number: '02',
                  icon: '🪴',
                  title: 'Explore your tools',
                  text: 'Discover crop, soil, weather, and marketplace features.'
                },
                {
                  number: '03',
                  icon: '🌈',
                  title: 'Grow with confidence',
                  text: 'Use helpful insights to support your farming decisions.'
                }
              ].map((step) => (
                <div className="col-md-4" key={step.number}>
                  <div className="lp-step">
                    <div className="lp-step-num">{step.number}</div>
                    <h3 style={{ color: '#254734', fontWeight: 800 }}>
                      {step.icon} {step.title}
                    </h3>
                    <p className="mb-0 mt-2" style={{ color: '#718073' }}>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ paddingBottom: '70px' }}>
          <div className="container">
            <div className="lp-cta">
              <div className="row align-items-center g-4">
                <div className="col-lg-8">
                  <div className="lp-script" style={{ color: '#ffe7a3' }}>
                    Your next chapter starts here ✨
                  </div>

                  <h2>Grow smarter. Farm happier.</h2>

                  <p style={{ color: '#e0eadf', lineHeight: 1.8 }}>
                    Join a growing community where technology and nature
                    work hand in hand.
                  </p>

                  <button
                    className="lp-btn"
                    style={{
                      background: '#ffe7a3',
                      borderColor: '#ffe7a3',
                      color: '#174c38'
                    }}
                    onClick={() => navigate('/signup')}
                  >
                    Join AgriTech 🌱
                  </button>
                </div>

                <div className="col-lg-4 text-center">
                  <div style={{ fontSize: '85px' }}>🌼🌿</div>
                  <div className="lp-script" style={{ color: '#ffe7a3' }}>
                    Let good things grow!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        className="lp-footer text-center py-4"
        style={{ background: '#fffaf0' }}
      >
        🌿 AgriTech · Growing a better tomorrow, together.
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
          {/* AI Crop Doctor: Farmer only */}
<Route
  path="/ai-crop-doctor"
  element={
    <ProtectedRoute allowedRoles={farmerOnly}>
      <AICropDoctorPage />
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
