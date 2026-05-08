import { useState, useEffect } from "react";

type Language = "pt" | "en";

export function useLanguage(): Language {
  const [language, setLanguage] = useState<Language>("pt");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
      return;
    }
    // Padrão: PT-BR
    setLanguage("pt");
  }, []);

  return language;
}

export function useLanguageWithSetter() {
  const [language, setLanguageState] = useState<Language>("pt");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      return;
    }
    // Padrão: PT-BR
    setLanguageState("pt");
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  return { language, setLanguage };
}
