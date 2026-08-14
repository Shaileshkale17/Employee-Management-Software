import { MapPin, Users } from "lucide-react";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  Closed: "bg-red-50 text-red-600 ring-red-500/20",
  Draft: "bg-ink-100 text-ink-500 ring-ink-500/15",
};

const JobPostCart = ({
  jobTitle,
  jobDescription,
  location,
  skills = [],
  jobType,
  experience,
  salary,
  applicantsCount,
  status = "Active",
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200 flex flex-col">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-base font-semibold text-ink-950 leading-snug">{jobTitle}</h2>
          <span className="chip bg-ink-100 text-ink-500 flex-shrink-0">
            <MapPin className="h-3 w-3" />
            {location}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/15">{jobType}</span>
          {status && (
            <span className={`chip ring-1 ${statusColors[status] || statusColors.Active}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-500 mt-2">Experience: {experience}</p>
        {salary && <p className="text-xs text-ink-500 mt-0.5">Salary: {salary}</p>}
        <p className="text-[13px] text-ink-600 leading-relaxed line-clamp-3 my-3.5">{jobDescription}</p>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-ink-600 ring-1 ring-ink-200/60 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-500/15">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <span className="text-xs font-medium text-ink-400 inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {applicantsCount || 0} applicants
        </span>
      </div>
    </div>
  );
};

export default JobPostCart;
