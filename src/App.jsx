import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GoogleLogin from "./components/GoogleLogin";
import { Loader2 } from "lucide-react";

// Lazy loaded citizen pages
const HomePage = lazy(() => import("./pages/HomePage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AuthoritiesPage = lazy(() => import("./pages/AuthoritiesPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));

// Lazy loaded admin layer
const AdminLayout = lazy(() => import("../admin/client/AdminLayout"));
const AdminRoute = lazy(() => import("../admin/client/AdminRoute"));
const AdminLoginPage = lazy(() => import("../admin/client/pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("../admin/client/pages/AdminDashboardPage"));
const IssueDetailPage = lazy(() => import("../admin/client/pages/IssueDetailPage"));
const WorkerManagementPage = lazy(() => import("../admin/client/pages/WorkerManagementPage"));
const WorkerLeaderboardPage = lazy(() => import("../admin/client/pages/WorkerLeaderboardPage"));
const CitizenLeaderboardPageAdmin = lazy(() => import("../admin/client/pages/CitizenLeaderboardPage"));

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map(function(c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Fallback loader for lazy components
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  
  useEffect(() => {
    const syncUser = async (id) => {
      try {
        const res = await fetch(`/api/user/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (currentUser?.id) {
      syncUser(currentUser.id);
    } else {
      const citizenId = localStorage.getItem("citizen_id");
      if (citizenId) {
        syncUser(citizenId);
      }
    }
  }, [currentUser?.id]);
  const handleLoginSuccess = async (credential) => {
    const payload = parseJwt(credential);
    if (!payload) return;
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem("citizen_id", user.id);
        setShowLoginModal(false);
      } else {
        alert("Backend server returned an error during login.");
      }
    } catch (e) {
      console.error("Login failed", e);
      alert("Failed to connect to backend server. Make sure 'npm run dev' is still running!");
    }
  };
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder-client-id"}>
      <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-200">
        {/* --- Admin routes (separate layout, no citizen Navbar/Footer) --- */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="issues/:id" element={<IssueDetailPage />} />
              <Route path="workers" element={<WorkerManagementPage />} />
              <Route path="leaderboard" element={<WorkerLeaderboardPage />} />
              <Route path="citizen-leaderboard" element={<CitizenLeaderboardPageAdmin />} />
            </Route>
          </Routes>
        </Suspense>

        {/* --- Citizen routes (original layout, unchanged) --- */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/*" element={null} />
            <Route path="*" element={<>
              <Navbar
                user={currentUser}
                onLoginClick={() => setShowLoginModal(true)}
                onLogoutClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem("citizen_id");
                }}
              />
              
              <main className="flex-1 flex flex-col">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/map" element={<MapPage currentUser={currentUser} onLoginClick={() => setShowLoginModal(true)} />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage currentUserId={currentUser?.id || null} />} />
                  <Route path="/verify" element={<VerifyPage currentUser={currentUser} />} />
                  <Route path="/whatsapp" element={<WhatsAppPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/authorities" element={<AuthoritiesPage />} />
                </Routes>
              </main>

              <Routes>
                <Route path="/map" element={null} />
                <Route path="*" element={<Footer />} />
              </Routes>

              {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="glass-panel p-8 rounded-3xl max-w-sm w-full relative">
                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white font-display mb-2">Sign In</h3>
                      <p className="text-sm text-slate-400">Join NagarSetu to report issues and earn points.</p>
                    </div>
                    
                    <GoogleLogin onLoginSuccess={handleLoginSuccess} />
                    
                    <p className="text-[10px] text-slate-500 text-center mt-6">
                      By continuing, you agree to NagarSetu's Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>
              )}
            </>} />
          </Routes>
        </Suspense>
      </div>
    </GoogleOAuthProvider>
  );
}
