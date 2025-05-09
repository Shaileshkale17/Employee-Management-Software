import React, { useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavbar from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import TextArea from "../components/TextArea";
import { toast } from "react-toastify";
const Job_post_form = () => {
  const { user } = useSelector((state) => state.auth);

  const sideNavComponent =
    user?.user?.role === "developer" ? (
      <SideNavbar />
    ) : user?.user?.role === "HR Manager" ? (
      <HRSideNavbar />
    ) : null;

  const ExperienceArray = [
    { label: "0-1 years", value: "0-1-years" },
    { label: "1-2 years", value: "1-2-years" },
    { label: "2-3 years", value: "2-3-years" },
    { label: "3-4 years", value: "3-4-years" },
    { label: "4-5 years", value: "4-5-years" },
    { label: "5-6 years", value: "5-6-years" },
    { label: "6-7 years", value: "6-7-years" },
    { label: "7-8 years", value: "7-8-years" },
    { label: "8-9 years", value: "8-9-years" },
    { label: "9-10 years", value: "9-10-years" },
    { label: "10+ years", value: "10-plus-years" },
  ];

  const JobType = [
    { label: "Full-time", value: "full_time" },
    { label: "Part-time", value: "part_time" },
    { label: "Internship", value: "internship" },
    { label: "Freelance", value: "freelance" },
    { label: "Contract", value: "contract" },
    { label: "Temporary", value: "temporary" },
    { label: "Volunteer", value: "volunteer" },
    { label: "Apprenticeship", value: "apprenticeship" },
  ];

  // Form State
  const [formData, setFormData] = useState({
    job_title: "",
    location: "",
    jobsalary: "",
    jobskills: "",
    jobExperience: "",
    jobType: "",
    jobDescription: "",
  });

  // Handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // Here you can send formData to backend using axios or fetch
  };

  return (
    <div className="flex flex-row w-full">
      {sideNavComponent}
      <div className="w-full min-h-screen gap-5   bg-gray-200">
        <div className="md:mt-2">
          <h1 className="text-start font-normal text-2xl">Job Post Form</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 justify-center items-center md:mt-14">
          <div className="flex flex-wrap gap-4">
            <InputBox
              label="Job Title"
              id="job_title"
              placeholder="Enter the Job Title"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
            />
            <InputBox
              label="Location"
              id="location"
              placeholder="Enter the job location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <InputBox
              label="Job Salary"
              id="jobsalary"
              placeholder="Enter the job salary"
              name="jobsalary"
              value={formData.jobsalary}
              onChange={handleChange}
            />
            <InputBox
              label="Skills"
              id="jobskills"
              placeholder="Enter the job skills"
              name="jobskills"
              value={formData.jobskills}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <SelectBox
              label="Experience"
              id="jobExperience"
              placeholder="Select experience"
              name="jobExperience"
              value={formData.jobExperience}
              onChange={handleChange}
              option={ExperienceArray}
            />

            <SelectBox
              label="Job Type"
              id="jobType"
              placeholder="Select job type"
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              option={JobType}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <TextArea
              label="Job Description"
              id="jobDescription"
              placeholder="Enter the job description"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            onClick={() => toast.info("server not connect")}
            className="bg-[#3354F4] mt-5 border border-solid border-[#3354F4] hover:bg-white hover:text-[#3354F4] px-4 py-2 rounded-md text-white font-montserrat font-medium text-md leading-relaxed tracking-tightest">
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
};

export default Job_post_form;
