import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, MapPin, Search, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../i18n/LanguageContext";
export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    reports: "0",
    resolved: "0",
    agencies: "0",
    cities: "0"
  });

  useEffect(() => {
    fetch("/api/transparency")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStats({
            reports: data.totalReports?.toString() || "0",
            resolved: data.resolvedIssues?.toString() || "0",
            agencies: data.agencies?.length?.toString() || "0",
            cities: "1" // App is currently single city focused in demo
          });
        }
      })
      .catch(console.error);
  }, []);
  return <div className="flex flex-col min-h-screen">
      {
    /* Hero Section */
  }
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden gradient-hero">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-ring" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-ring" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className="max-w-4xl mx-auto space-y-8"
  >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-indigo-300 text-sm font-semibold tracking-wide">
              <ShieldCheck className="h-4 w-4" />
              <span>{t("home.hero_title")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-white leading-tight">
              NagarSetu
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              {t("home.hero_subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link
    to="/map"
    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-lg transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
  >
                <MapPin className="h-5 w-5 group-hover:animate-bounce" />
                {t("home.cta_report")}
              </Link>
              <Link
    to="/map"
    className="w-full sm:w-auto px-8 py-4 glass hover:bg-slate-800/80 text-white rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 group"
  >
                <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {t("home.cta_map")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {
    /* Stats Section */
  }
      <section className="py-12 bg-slate-950 relative z-20 -mt-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
    { count: stats.reports, label: t("home.stats_reports") },
    { count: stats.resolved, label: t("home.stats_resolved") },
    { count: stats.agencies, label: t("home.stats_agencies") },
    { count: stats.cities, label: t("home.stats_cities") }
  ].map((stat, i) => <motion.div
    key={i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.1 }}
    className="glass-panel p-6 text-center rounded-2xl"
  >
                <div className="text-3xl md:text-4xl font-bold font-mono text-indigo-400 mb-2">{stat.count}</div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {
    /* How it Works Section */
  }
      <section className="py-24 bg-[#0a0614]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
              {t("home.how_title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {
    /* Connecting line for desktop */
  }
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-800 z-0">
              <div className="absolute top-0 left-0 h-full bg-indigo-500 w-1/2 opacity-50 animate-pulse-ring" />
            </div>

            {[
    {
      step: "01",
      icon: <MapPin className="h-8 w-8 text-indigo-400" />,
      title: t("home.step1_title"),
      desc: t("home.step1_desc")
    },
    {
      step: "02",
      icon: <CheckCircle2 className="h-8 w-8 text-purple-400" />,
      title: t("home.step2_title"),
      desc: t("home.step2_desc")
    },
    {
      step: "03",
      icon: <AlertTriangle className="h-8 w-8 text-emerald-400" />,
      title: t("home.step3_title"),
      desc: t("home.step3_desc")
    }
  ].map((item, i) => <motion.div
    key={i}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.2 }}
    className="relative z-10 glass-panel-hover p-8 rounded-3xl text-center group"
  >
                <div className="w-24 h-24 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-6 border-4 border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                  {item.icon}
                </div>
                <div className="absolute top-4 right-6 text-5xl font-display font-bold text-slate-800/50 -z-10 select-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </motion.div>)}
          </div>
        </div>
      </section>
      
      {
    /* Ready CTA */
  }
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517737803025-533d11b34e55?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">
            {t("map.ready_title")}
          </h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            {t("map.ready_desc")}
          </p>
          <Link
    to="/map"
    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-950 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20"
  >
            {t("home.cta_report")} <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>;
}
