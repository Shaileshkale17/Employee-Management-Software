import { Link, useParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";

const ApplicationSuccess = () => {
  const { slug } = useParams();
  return (
    <div className="min-h-screen bg-mesh-light flex items-center justify-center px-4">
      <div className="max-w-md w-full card-surface shadow-popover p-10 text-center animate-fade-in-up">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-emerald-100 blur-xl animate-pulse-soft" aria-hidden="true" />
          <div className="relative w-20 h-20 mx-auto rounded-full bg-emerald-50 ring-1 ring-emerald-500/20 flex items-center justify-center animate-scale-in">
            <CircleCheck className="w-10 h-10 text-emerald-600 animate-pop" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-ink-950 mb-2">Application Submitted!</h1>
        <p className="text-sm text-ink-500 leading-relaxed mb-8">
          Thank you for applying. Our team will review your application and get back to you soon. A confirmation email has been sent to your inbox.
        </p>
        <div className="flex flex-col gap-3">
          <Link to={`/careers/${slug}`} className="btn-primary btn-md inline-flex items-center justify-center w-full">
            Browse more jobs
          </Link>
          <Link to="/" className="btn-ghost btn-md inline-flex items-center justify-center w-full">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
