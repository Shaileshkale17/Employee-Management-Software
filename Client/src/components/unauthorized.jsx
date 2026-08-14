import { Link } from "react-router-dom";
import { Lock, House } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-surface-100">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px]" aria-hidden="true" />
      <div className="relative text-center animate-fade-in-up">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-lg" aria-hidden="true" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-red-500 shadow-card ring-1 ring-ink-200/60">
            <Lock className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-ink-200 mb-2">401</h1>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Unauthorized Access</h2>
        <p className="text-ink-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          You don&apos;t have permission to view this page. Please contact your administrator.
        </p>
        <Link to="/overview" className="btn-primary btn-lg">
          <House className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
