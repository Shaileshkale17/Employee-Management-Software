import React from "react";

const JobPostCart = ({
  index,
  jobDescription,
  jobTitle,
  location,
  skills = [],
  jobType,
  numberOfApply,
  experience,
}) => {
  return (
    <div className="bg-white relative shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition duration-300 h-72">
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Title and Location */}
          <div className="flex flex-row justify-between items-center mb-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-800">{jobTitle}</h2>
            <p className="text-sm font-semibold text-gray-600">{location}</p>
          </div>

          {/* Job Type and Experience */}
          <p className="text-gray-600 text-sm mb-1">{jobType}</p>
          <p className="text-gray-600 text-sm mb-2">Experience: {experience}</p>

          {/* Job Description */}
          <p className="text-sm text-gray-500 mb-4 line-clamp-3">
            {jobDescription}
          </p>

          {/* Skills */}
          {Array.isArray(skills) && skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Number of Applicants */}
        <div className="mt-auto">
          <p className="text-sm text-gray-600">Applicants: {numberOfApply}</p>
        </div>
      </div>
    </div>
  );
};

export default JobPostCart;
