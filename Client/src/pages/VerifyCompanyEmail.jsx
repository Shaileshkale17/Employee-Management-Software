import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../utils/api";
import { LoaderCircle, CircleCheck, CircleAlert } from "lucide-react";

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
    <div className="min-h-screen bg-mesh-light flex items-center justify-center px-4">
      <div className="max-w-md w-full card-surface shadow-popover p-10 text-center animate-fade-in-up">
        {state === "loading" && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 ring-1 ring-brand-500/10 flex items-center justify-center mb-5 animate-pulse-soft">
              <LoaderCircle className="animate-spin h-6 w-6 text-brand-600" />
            </div>
            <h1 className="text-lg font-bold text-ink-950">Verifying your email...</h1>
          </>
        )}
        {state === "success" && (
          <>
            <div className="relative mx-auto mb-6 h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-emerald-100 blur-xl animate-pulse-soft" aria-hidden="true" />
              <div className="relative w-20 h-20 mx-auto rounded-full bg-emerald-50 ring-1 ring-emerald-500/20 flex items-center justify-center animate-scale-in">
                <CircleCheck className="w-10 h-10 text-emerald-600 animate-pop" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-ink-950 mb-2">Email verified!</h1>
            <p className="text-sm text-ink-500 mb-8">Your company workspace is now active. You can log in with your admin credentials.</p>
            <Link to="/" className="btn-primary btn-md inline-flex items-center justify-center w-full">
              Go to Login
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 ring-1 ring-red-500/10 flex items-center justify-center mb-5 animate-scale-in">
              <CircleAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-lg font-bold text-ink-950 mb-2">Verification failed</h1>
            <p className="text-sm text-ink-500 mb-8">This link is invalid or has expired. Please contact support.</p>
            <Link to="/" className="btn-primary btn-md inline-flex items-center justify-center w-full">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyCompanyEmail;
