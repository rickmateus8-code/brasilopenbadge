import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  // O sistema é agora estritamente DARK
  const [theme] = useState<Theme>("dark");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("dark");
    localStorage.setItem("docmaster-theme", "dark");
  }, []);

  const toggleTheme = () => {
    console.log("O sistema DocMaster agora é exclusivamente Dark Mode.");
  };
  
  const setTheme = (t: Theme) => {
    console.log("Alteração manual de tema desativada.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, switchable: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
