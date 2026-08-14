import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { ClipboardIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-purple-50 text-purple-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const AppraisalProcesses = () => (
  <HRSectionCRUD
    title="Appraisal Processes"
    subtitle="Plan and track employee appraisals"
    apiPath="performance"
    listEndpoint="performance-all"
    createEndpoint="performance-post"
    updateEndpoint="performance-update"
    deleteEndpoint="performance-delete"
    filterParam="type"
    filterValue="appraisal"
    fixedValues={{ type: "appraisal" }}
    addLabel="Add Appraisal"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Appraisal title", type: "text", required: true, placeholder: "e.g. Annual review 2026" },
      { name: "rating", label: "Rating (1-5)", type: "number", min: 1, max: 5, placeholder: "4" },
      { name: "reviewer", label: "Reviewer", type: "reviewer" },
      { name: "effectiveDate", label: "Review date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed", "Approved", "Rejected"] },
      { name: "description", label: "Review summary", type: "textarea", placeholder: "Summary of the appraisal" },
    ]}
    stats={[
      { label: "Total Appraisals", color: "brand", icon: <ClipboardIcon />, get: (r) => r.length },
      { label: "Pending", color: "amber", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Pending").length },
      { label: "Completed", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Completed").length },
    ]}
    detailLines={[
      { label: "Rating", key: "rating", type: "rating" },
      { label: "Reviewer", key: "reviewer", type: "employee" },
      { label: "Review date", key: "effectiveDate", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No appraisals found"
    emptyDescription="Add appraisal records to track the review process."
  />
);

export default AppraisalProcesses;
