import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("1campus-theme");
        if (saved) return saved;
        return window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("1campus-theme", theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
