import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../utils/api";

const VerifyCompanyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const company = searchParams.get("company");
  const [state, setState] = useState("loading");

  useEffect(() => {
    api.get("/company/verify-email", { params: { token, company } })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token, company]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 p-10 text-center">
        {state === "loading" && (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-5">
              <svg className="animate-spin h-6 w-6 text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Verifying your email...</h1>
          </>
        )}
        {state === "success" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-sm text-gray-500 mb-8">Your company workspace is now active. You can log in with your admin credentials.</p>
            <Link to="/" className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Go to Login
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-sm text-gray-500 mb-8">This link is invalid or has expired. Please contact support.</p>
            <Link to="/" className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyCompanyEmail;
