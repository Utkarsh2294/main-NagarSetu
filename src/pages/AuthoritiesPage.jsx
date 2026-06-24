import { useState, useEffect } from "react";
import { Search, MapPin, Globe, Phone, Building } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../i18n/LanguageContext";
export default function AuthoritiesPage() {
  const { t } = useLanguage();
  const [authorities, setAuthorities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [detectedCity, setDetectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAuths = async () => {
      try {
        const res = await fetch("/api/authorities");
        const data = await res.json();
        setAuthorities(data);
      } catch (err) {
        console.error("Failed to load authorities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuths();
  }, []);
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.county || data.address.state_district;
          if (city) {
            setDetectedCity(city);
            setSearchTerm(city);
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      }, () => {
        console.log("Geolocation denied");
      });
    }
  }, []);
  const filtered = authorities.filter(
    (a) => a.city.toLowerCase().includes(searchTerm.toLowerCase()) || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.state.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {
    /* Header & Search */
  }
        <div className="text-center mb-16 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-tight mb-4">
              {t("authorities.title")}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              {t("authorities.subtitle")}
            </p>

            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
    type="text"
    className="w-full bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-full py-4 pl-12 pr-4 text-white outline-none transition-all shadow-lg backdrop-blur-sm"
    placeholder={t("authorities.search_placeholder")}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
            </div>
            
            <div className="mt-4 h-6 text-sm text-indigo-400 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              {detectedCity ? `${t("authorities.your_city")}: ${detectedCity}` : t("authorities.detecting")}
            </div>
          </motion.div>
        </div>

        {
    /* Grid */
  }
        {loading ? <div className="flex justify-center items-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.length > 0 ? filtered.map((auth, idx) => {
    const isMatch = detectedCity && auth.city.toLowerCase().includes(detectedCity.toLowerCase());
    return <motion.div
      key={auth.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className={`glass-panel p-6 rounded-3xl transition-all duration-300 ${isMatch ? "ring-2 ring-indigo-500 shadow-indigo-500/20 shadow-xl" : "hover:border-slate-600"}`}
    >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-indigo-400" />
                    </div>
                    {isMatch && <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">Local Match</span>}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-2" title={auth.name}>{auth.name}</h3>
                  <div className="text-indigo-400 font-medium text-sm mb-4">{auth.city}, {auth.state}</div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{t("authorities.jurisdiction")}: {auth.jurisdiction}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <a href={`tel:${auth.phone}`} className="hover:text-indigo-400 transition-colors">{auth.phone}</a>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                      <a href={auth.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 truncate">
                        {auth.website.replace("https://", "").replace("http://", "")}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto border-t border-slate-800/50 pt-4">
                    {auth.categories.map((cat) => <span key={cat} className="text-[10px] uppercase tracking-wider font-semibold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                        {cat}
                      </span>)}
                  </div>
                </motion.div>;
  }) : <div className="col-span-full text-center py-20 text-slate-400">
                No authorities found matching your search.
              </div>}
          </div>}
      </div>
    </div>;
}
