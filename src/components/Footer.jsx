import { Link } from "react-router-dom";
import { ShieldCheck, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
export default function Footer() {
  const { t } = useLanguage();
  return <footer className="bg-slate-950 border-t border-slate-800/50 pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {
    /* Brand */
  }
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group inline-flex">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-display text-white tracking-tight">NagarSetu</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {
    /* Quick Links */
  }
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">{t("footer.quick_links")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.home")}</Link></li>
              <li><Link to="/map" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.map")}</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.dashboard")}</Link></li>
              <li><Link to="/leaderboard" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.leaderboard")}</Link></li>
            </ul>
          </div>

          {
    /* Resources */
  }
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">{t("footer.resources")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.about")}</Link></li>
              <li><Link to="/authorities" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.authorities")}</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("nav.contact")}</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">{t("footer.faq")}</a></li>
            </ul>
          </div>

          {
    /* Connect */
  }
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">{t("footer.connect")}</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {(/* @__PURE__ */ new Date()).getFullYear()} {t("footer.copyright")}
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-slate-300 transition-colors">{t("footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>;
}
