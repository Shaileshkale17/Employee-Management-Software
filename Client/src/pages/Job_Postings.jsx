import React, { useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Searchicon from "../assets/iconamoon_search-thin.svg";
import JobPostCart from "../components/Job_post_cart";
const Job_Postings = () => {
  const { user } = useSelector((state) => state.auth);
  console.log(user.user.role);
  const [Search, setSearch] = useState("");
  const SideNav = (role) => {
    switch (role) {
      case "developer":
        return <SideNavbar />;
      case "HR Manager":
        return <HRSideNavber />;
      default:
        return null;
    }
  };

  const JobPostings = [
    {
      jobTitle: "Frontend Developer",
      jobDescription:
        "Join Techwave Solutions as a Frontend Developer and work with a dynamic team to build responsive web applications using the latest frontend technologies. We focus on innovation, collaboration, and career growth.",
      location: "Remote",
      experience: "1-3 years",
      skills: ["HTML", "CSS", "JavaScript", "React.js"],
      salary: "₹4-6 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-25",
      numberOfApply: 50,
    },
    {
      jobTitle: "Backend Developer",
      jobDescription:
        "NextGen Technologies is looking for a Backend Developer proficient in Node.js and databases. You will be responsible for building scalable backend systems, APIs, and working with cloud infrastructure.",
      location: "Bangalore",
      experience: "2-4 years",
      skills: ["Node.js", "Express.js", "MongoDB", "SQL"],
      salary: "₹5-8 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-24",
      numberOfApply: 40,
    },
    {
      jobTitle: "Full Stack Developer",
      jobDescription:
        "Innovatech Pvt Ltd invites Full Stack Developers to join a creative team building end-to-end web solutions. The role involves frontend, backend development, and cloud deployment experience.",
      location: "Hyderabad",
      experience: "3-5 years",
      skills: ["React.js", "Node.js", "PostgreSQL", "AWS"],
      salary: "₹7-10 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-23",
      numberOfApply: 30,
    },
    {
      jobTitle: "UI/UX Designer",
      jobDescription:
        "DesignPro Studios is seeking a creative UI/UX Designer to craft engaging and intuitive user experiences. You will collaborate with product managers and developers to bring concepts to life.",
      location: "Mumbai",
      experience: "1-2 years",
      skills: ["Figma", "Adobe XD", "Sketch", "User Research"],
      salary: "₹3-5 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-22",
      numberOfApply: 25,
    },
    {
      jobTitle: "Software Engineer",
      jobDescription:
        "AlphaCode Tech is hiring passionate Software Engineers who are strong in problem-solving, coding, and data structures. Be part of an innovative team delivering impactful software products.",
      location: "Pune",
      experience: "0-2 years",
      skills: ["C++", "Java", "Data Structures", "Algorithms"],
      salary: "₹4-6 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-21",
      numberOfApply: 70,
    },
    {
      jobTitle: "React Native Developer",
      jobDescription:
        "MobilityFirst is seeking a React Native Developer to build high-performance mobile apps. You will work with designers and backend engineers to deliver seamless user experiences.",
      location: "Remote",
      experience: "2-3 years",
      skills: ["React Native", "Redux", "REST APIs", "Firebase"],
      salary: "₹5-7 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-20",
      numberOfApply: 35,
    },
    {
      jobTitle: "Data Analyst",
      jobDescription:
        "Insight Analytics is looking for a Data Analyst to interpret data, analyze results, and provide ongoing reports. You will help drive strategic business decisions based on insights.",
      location: "Chennai",
      experience: "1-3 years",
      skills: ["Excel", "SQL", "Python", "Power BI"],
      salary: "₹4-6 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-19",
      numberOfApply: 45,
    },
    {
      jobTitle: "DevOps Engineer",
      jobDescription:
        "CloudCore Systems is hiring a DevOps Engineer to manage cloud infrastructure, automate deployments, and improve system reliability. Join a team that prioritizes innovation and efficiency.",
      location: "Remote",
      experience: "3-5 years",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      salary: "₹8-12 LPA",
      jobType: "Full-time",
      postedOn: "2025-04-18",
      numberOfApply: 20,
    },
    // {
    //   jobTitle: "PHP Developer",
    //   jobDescription:
    //     "WebWorks Agency is hiring a PHP Developer experienced in Laravel and JavaScript. You will be involved in building dynamic websites and custom CMS solutions for our global clients.",
    //   location: "Delhi",
    //   experience: "2-4 years",
    //   skills: ["PHP", "Laravel", "MySQL", "JavaScript"],
    //   salary: "₹3-5 LPA",
    //   jobType: "Full-time",
    //   postedOn: "2025-04-17",
    //   numberOfApply: 28,
    // },
    // {
    //   jobTitle: "QA Engineer",
    //   jobDescription:
    //     "TestRight Solutions seeks a QA Engineer to design test plans, debug code, and improve software quality. You will work closely with development teams to ensure a smooth product release.",
    //   location: "Kolkata",
    //   experience: "1-3 years",
    //   skills: ["Manual Testing", "Selenium", "JIRA", "API Testing"],
    //   salary: "₹4-6 LPA",
    //   jobType: "Full-time",
    //   postedOn: "2025-04-16",
    //   numberOfApply: 38,
    // },
  ];

  return (
    <div className="flex flex-row w-full">
      {SideNav(user.user.role)}
      <div className="w-full min-h-screen flex flex-col  px-5 bg-gray-200">
        <div className="flex justify-between items-center mt-6">
          <div className="h-10  flex bg-white p-2 rounded-md ">
            <img src={Searchicon} alt="" />
            <input
              type="text"
              name="Search"
              id="Search"
              placeholder="Search your employee / manager..."
              className="w-96 p-2 outline-none"
              value={Search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/Job-post-form">
            <button className="bg-[#3354F4] border border-solid border-[#3354F4] hover:bg-white hover:text-[#3354F4] px-4 py-2 rounded-md text-white font-montserrat font-medium text-md leading-relaxed tracking-tightest">
              Post Job
            </button>
          </Link>
        </div>
        <div className="h-full mt-5 grid col-span-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 xl:grid-cols-4 mb-5 ">
          {JobPostings.filter(
            (item) =>
              item?.jobTitle
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase()) ||
              item?.jobDescription
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase()) ||
              item?.location
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase()) ||
              item?.salary
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase()) ||
              item?.jobType
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase()) ||
              item?.experience
                .toLocaleLowerCase()
                .includes(Search.toLocaleLowerCase())
          ).map((item, index) => (
            <JobPostCart
              index={index}
              jobDescription={item?.jobDescription}
              location={item?.location}
              jobTitle={item?.jobTitle}
              skills={item?.skills}
              jobType={item?.jobType}
              numberOfApply={item?.numberOfApply}
              experience={item?.experience}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Job_Postings;
