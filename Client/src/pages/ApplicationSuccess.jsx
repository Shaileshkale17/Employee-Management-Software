import { Link, useParams } from "react-router-dom";

const ApplicationSuccess = () => {
  const { slug } = useParams();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 p-10 text-center animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Thank you for applying. Our team will review your application and get back to you soon. A confirmation email has been sent to your inbox.
        </p>
        <div className="flex flex-col gap-3">
          <Link to={`/careers/${slug}`} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            Browse more jobs
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
