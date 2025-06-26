import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    //console.log("[Init] Kaydedilmiş tema:", savedTheme);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    //console.log("[Init] Sistem tercihi karanlık mı?", prefersDark);
    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    //console.log("[Effect] Tema uygulanıyor:", isDark ? "dark" : "light");

    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    //console.log("[Toggle] Tema değiştiriliyor. Yeni tema:", !isDark ? "dark" : "light");
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-full shadow-lg transition"
    >
      {isDark ? "☀️ Işığı Aç" : "🌙 Gece Modu"}
    </button>
  );
}
