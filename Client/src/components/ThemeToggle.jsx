import { Moon, Sun } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../redux/slices/themeSlice";

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full bg-white/80 p-2.5 ring-1 ring-ink-200 shadow-sm transition-all duration-200 hover:bg-brand-50 hover:ring-brand-200 hover:shadow-md active:scale-95 dark:bg-white/10 dark:ring-ink-700/60 dark:hover:bg-white/15 dark:hover:ring-brand-500/40">
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-brand-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
