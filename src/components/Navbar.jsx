import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Menu, X, Globe, User } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
export default function Navbar({ user, onLoginClick, onLogoutClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.map"), path: "/map" },
    { name: t("nav.dashboard"), path: "/dashboard" },
    { name: t("nav.leaderboard"), path: "/leaderboard" },
    { name: "Community Verification", path: "/verify" },
    { name: t("nav.whatsapp"), path: "/whatsapp" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.authorities"), path: "/authorities" },
    { name: t("nav.contact"), path: "/contact" }
  ];
  const isActive = (path) => location.pathname === path;
  return <nav
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass shadow-lg py-3" : "bg-transparent py-5"}`}
  >
      <div className="w-full px-6 md:px-12 flex justify-between items-center relative">
        {
    /* Left: Logo */
  }
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-white tracking-tight">NagarSetu</span>
          </Link>
        </div>

        {
    /* Center: Desktop Nav Links */
  }
        <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1 border border-slate-700/50 backdrop-blur-md">
            {navLinks.map((link) => <Link
    key={link.path}
    to={link.path}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive(link.path) ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-700/50"}`}
  >
                {link.name}
              </Link>)}
          </div>
        </div>

        {
    /* Right: Language & Auth */
  }
        <div className="flex-1 flex justify-end items-center gap-4 hidden lg:flex">
          <div className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <Globe className="h-4 w-4" />
            <select
    value={language}
    onChange={(e) => setLanguage(e.target.value)}
    className="bg-transparent text-slate-300 outline-none cursor-pointer hover:text-white appearance-none pr-2"
  >
              <option value="en" className="bg-slate-800 text-slate-200">English</option>
              <option value="hi" className="bg-slate-800 text-slate-200">Hindi</option>
            </select>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-2" />

          {user ? <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden xl:flex">
                <span className="text-sm font-bold text-slate-100">{user.name}</span>
                <span className="text-xs text-indigo-400 font-mono">{user.points} pts</span>
              </div>
              {user.picture ? <img src={user.picture} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-indigo-500 cursor-pointer hover:opacity-80" onClick={onLogoutClick} title={t("nav.logout")} /> : <div className="w-9 h-9 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center cursor-pointer hover:bg-indigo-800" onClick={onLogoutClick} title={t("nav.logout")}>
                  <User className="h-5 w-5 text-indigo-300" />
                </div>}
            </div> : <button
    onClick={onLoginClick}
    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
  >
              {t("nav.login")}
            </button>}
        </div>

        {
    /* Mobile Toggle */
  }
        <button
    className="lg:hidden p-2 text-slate-300 hover:text-white flex-1 flex justify-end"
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {
    /* Mobile Menu */
  }
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className="absolute top-full left-0 right-0 glass border-t border-slate-700/50 p-4 lg:hidden flex flex-col gap-2 shadow-2xl"
  >
            {navLinks.map((link) => <Link
    key={link.path}
    to={link.path}
    onClick={() => setIsMobileMenuOpen(false)}
    className={`p-3 rounded-lg text-base font-medium ${isActive(link.path) ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-300 hover:bg-slate-800"}`}
  >
                {link.name}
              </Link>)}
            
            <div className="h-px w-full bg-slate-700/50 my-2" />
            
            <div className="flex items-center gap-2 p-3 rounded-lg text-slate-300 text-base font-medium">
              <Globe className="h-5 w-5 text-indigo-400" />
              <select
    value={language}
    onChange={(e) => {
      setLanguage(e.target.value);
      setIsMobileMenuOpen(false);
    }}
    className="bg-transparent text-slate-300 outline-none w-full appearance-none"
  >
                <option value="en" className="bg-slate-800">English</option>
                <option value="hi" className="bg-slate-800">Hindi (हिंदी)</option>
              </select>
            </div>

            {user ? <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mt-2 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  {user.picture ? <img src={user.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-indigo-500" /> : <div className="w-10 h-10 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-300" />
                    </div>}
                  <div>
                    <div className="text-sm font-bold text-slate-100">{user.name}</div>
                    <div className="text-xs text-indigo-400 font-mono">{user.points} pts</div>
                  </div>
                </div>
                <button onClick={() => {
    onLogoutClick();
    setIsMobileMenuOpen(false);
  }} className="text-xs text-slate-400 hover:text-rose-400">
                  {t("nav.logout")}
                </button>
              </div> : <button
    onClick={() => {
      onLoginClick();
      setIsMobileMenuOpen(false);
    }}
    className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition-colors"
  >
                {t("nav.login")}
              </button>}
          </motion.div>}
      </AnimatePresence>
    </nav>;
}
