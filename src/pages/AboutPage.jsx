import { Target, Eye, ShieldAlert, Award, Code, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../i18n/LanguageContext";
export default function AboutPage() {
  const { t } = useLanguage();
  return <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        
        {
    /* Header */
  }
        <div className="text-center mb-16 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-bold font-display text-white tracking-tight">
              {t("about.title")}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-6 rounded-full" />
          </motion.div>
        </div>

        {
    /* Mission & Vision */
  }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 }}
    className="glass-panel p-8 rounded-3xl relative overflow-hidden group"
  >
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Target className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{t("about.mission_title")}</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {t("about.mission_desc")}
              </p>
            </div>
          </motion.div>

          <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
    className="glass-panel p-8 rounded-3xl relative overflow-hidden group"
  >
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Eye className="w-32 h-32 text-purple-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{t("about.vision_title")}</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {t("about.vision_desc")}
              </p>
            </div>
          </motion.div>
        </div>

        {
    /* Values */
  }
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-10 font-display">{t("about.values_title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel-hover p-6 rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t("about.value1_title")}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t("about.value1_desc")}</p>
            </div>
            
            <div className="glass-panel-hover p-6 rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 text-amber-400">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t("about.value2_title")}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t("about.value2_desc")}</p>
            </div>
            
            <div className="glass-panel-hover p-6 rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 text-rose-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t("about.value3_title")}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t("about.value3_desc")}</p>
            </div>
          </div>
        </div>

        {
    /* Tech Stack */
  }
        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold text-white mb-4 font-display">{t("about.tech_title")}</h2>
              <p className="text-slate-400 mb-6">Built with modern web technologies for scale, speed, and real-time responsiveness.</p>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["React 19", "JavaScript", "Node.js/Express", "Tailwind CSS", "Leaflet Maps", "Gemini AI"].map((tech, i) => <div key={i} className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">{tech}</span>
                </div>)}
            </div>
          </div>
        </div>

      </div>
    </div>;
}
