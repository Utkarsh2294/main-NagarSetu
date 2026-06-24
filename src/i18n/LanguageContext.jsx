import { createContext, useContext, useState } from "react";
import en from "./en.json";
import hi from "./hi.json";
const translations = { en, hi };
const LanguageContext = createContext(void 0);
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const t = (path) => {
    const keys = path.split(".");
    let result = translations[language];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
