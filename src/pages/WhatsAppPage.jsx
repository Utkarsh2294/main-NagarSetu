import { useState } from "react";
import WhatsAppSimulator from "../components/WhatsAppSimulator";
import { useLanguage } from "../i18n/LanguageContext";
export default function WhatsAppPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleSimulateReport = async (params) => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.success && data.waLog) {
        setMessages((prev) => [...prev, data.waLog]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white font-display">{t("whatsapp.title")}</h1>
          <p className="text-slate-400 mt-2">{t("whatsapp.subtitle")}</p>
        </div>
        
        <WhatsAppSimulator
    onSimulateReport={handleSimulateReport}
    whatsappMessages={messages}
    loading={loading}
  />
      </div>
    </div>;
}
