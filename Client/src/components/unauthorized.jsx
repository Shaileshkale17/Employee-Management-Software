import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200">
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 mb-6">
          <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-7xl font-bold text-gray-200 mb-2">401</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Unauthorized Access</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
          You don&apos;t have permission to view this page. Please contact your administrator.
        </p>
        <Link
          to="/overview"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
