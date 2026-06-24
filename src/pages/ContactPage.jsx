import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../i18n/LanguageContext";
export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5e3);
    }, 800);
  };
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {
    /* Header */
  }
        <div className="text-center mb-16 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-tight">
              {t("contact.title")}
            </h1>
            <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {
    /* Contact Form */
  }
          <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="glass-panel p-8 md:p-10 rounded-3xl"
  >
            {submitted ? <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                <p className="text-slate-400">We'll get back to you within 24 hours.</p>
              </div> : <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t("contact.name")}</label>
                  <input
    type="text"
    required
    className="w-full bg-slate-900/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-slate-100 transition-colors"
    placeholder="John Doe"
  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t("contact.email")}</label>
                  <input
    type="email"
    required
    className="w-full bg-slate-900/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-slate-100 transition-colors"
    placeholder="john@example.com"
  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t("contact.message")}</label>
                  <textarea
    required
    rows={5}
    className="w-full bg-slate-900/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-slate-100 transition-colors resize-none"
    placeholder="How can we help you?"
  />
                </div>
                <button
    type="submit"
    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 font-bold transition-colors flex items-center justify-center gap-2"
  >
                  <Send className="w-5 h-5" />
                  {t("contact.send")}
                </button>
              </form>}
          </motion.div>

          {
    /* Contact Info */
  }
          <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6"
  >
            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-8 font-display">{t("contact.info_title")}</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">{t("contact.email_label")}</h4>
                    <a href="mailto:contact@nagarsetu.org" className="text-lg text-white hover:text-indigo-400 transition-colors">contact@nagarsetu.org</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">{t("contact.phone_label")}</h4>
                    <a href="tel:+919876543210" className="text-lg text-white hover:text-indigo-400 transition-colors">+91 98765 43210</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">{t("contact.location_label")}</h4>
                    <p className="text-lg text-white">Innovation Hub, Koramangala<br />Bengaluru, Karnataka 560034<br />India</p>
                  </div>
                </div>
              </div>
            </div>

            {
    /* Map Embed Placeholder */
  }
            <div className="glass-panel p-2 rounded-3xl h-64 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
                <p className="text-slate-400 font-medium">Interactive Map Loading...</p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>;
}
