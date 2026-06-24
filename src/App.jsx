import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import DashboardPage from "./pages/DashboardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AuthoritiesPage from "./pages/AuthoritiesPage";
import VerifyPage from "./pages/VerifyPage";
import GoogleLogin from "./components/GoogleLogin";
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
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  useEffect(() => {
    if (currentUser) {
      const syncUser = async () => {
        try {
          const res = await fetch(`/api/user/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      const iv = setInterval(syncUser, 1e4);
      return () => clearInterval(iv);
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
        setShowLoginModal(false);
      } else {
        alert("Backend server returned an error during login.");
      }
    } catch (e) {
      console.error("Login failed", e);
      alert("Failed to connect to backend server. Make sure 'npm run dev' is still running!");
    }
  };
  return <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-200">
      <Navbar
    user={currentUser}
    onLoginClick={() => setShowLoginModal(true)}
    onLogoutClick={() => setCurrentUser(null)}
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

      {
    /* Conditionally render footer if not on MapPage to save screen space */
  }
      <Routes>
        <Route path="/map" element={null} />
        <Route path="*" element={<Footer />} />
      </Routes>

      {
    /* Login Modal */
  }
      {showLoginModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
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
        </div>}
    </div>;
}
