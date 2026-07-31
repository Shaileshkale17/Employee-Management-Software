const statusColors = {
  Active: "bg-green-50 text-green-700",
  Closed: "bg-red-50 text-red-600",
  Draft: "bg-gray-100 text-gray-500",
};

const JobPostCart = ({ jobTitle, jobDescription, location, skills = [], jobType, experience, salary, applicantsCount, status = "Active" }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-base font-semibold text-gray-900 leading-snug">{jobTitle}</h2>
          <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{location}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500">{jobType}</span>
          {status && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[status] || statusColors.Active}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-1">Exp: {experience}</p>
        {salary && <p className="text-xs text-gray-500 mb-3">{salary}</p>}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{jobDescription}</p>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.map((skill, idx) => (
              <span key={idx} className="bg-brand-50 text-brand-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">Applicants: {applicantsCount || 0}</span>
      </div>
    </div>
  );
};

export default JobPostCart;
