import { useState, useEffect } from "react";
import TransparencyDashboard from "../components/TransparencyDashboard";
import { useLanguage } from "../i18n/LanguageContext";
export default function DashboardPage() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/transparency");
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        console.error("Failed to fetch dashboard metrics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3e4);
    return () => clearInterval(interval);
  }, []);
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white font-display">{t("dashboard.title")}</h1>
          <p className="text-slate-400 mt-2">{t("dashboard.subtitle")}</p>
        </div>
        
        <TransparencyDashboard metrics={metrics} loading={loading} />
      </div>
    </div>;
}
