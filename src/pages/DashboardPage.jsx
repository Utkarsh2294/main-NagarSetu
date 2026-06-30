import { useState, useEffect } from "react";
import TransparencyDashboard from "../components/TransparencyDashboard";
import { useLanguage } from "../i18n/LanguageContext";
export default function DashboardPage() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, issuesRes] = await Promise.all([
          fetch("/api/transparency"),
          fetch("/api/issues")
        ]);
        const metricsData = await metricsRes.json();
        const issuesData = await issuesRes.json();
        setMetrics(metricsData);
        setIssues(issuesData);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3e4);
    return () => clearInterval(interval);
  }, []);
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white font-display">{t("dashboard.title")}</h1>
          <p className="text-slate-400 mt-2">{t("dashboard.subtitle")}</p>
        </div>

        <TransparencyDashboard metrics={metrics} issues={issues} loading={loading} />
      </div>
    </div>;
}
