import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { CommentIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-purple-50 text-purple-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const FeedbackCollection = () => (
  <HRSectionCRUD
    title="Feedback Collection"
    subtitle="Collect and manage performance feedback"
    apiPath="performance"
    listEndpoint="performance-all"
    createEndpoint="performance-post"
    updateEndpoint="performance-update"
    deleteEndpoint="performance-delete"
    filterParam="type"
    filterValue="feedback"
    fixedValues={{ type: "feedback" }}
    addLabel="Add Feedback"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Feedback title", type: "text", required: true, placeholder: "e.g. Peer review — Q3" },
      { name: "feedbackType", label: "Feedback type", type: "select", options: ["Peer", "Manager", "Self"] },
      { name: "reviewer", label: "Submitted by", type: "reviewer" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed", "Approved", "Rejected"] },
      { name: "description", label: "Feedback", type: "textarea", placeholder: "Write the feedback" },
    ]}
    stats={[
      { label: "Total Feedback", color: "brand", icon: <CommentIcon />, get: (r) => r.length },
      { label: "Peer", color: "blue", icon: <ClockIcon />, get: (r) => r.filter((x) => x.feedbackType === "Peer").length },
      { label: "Manager", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.feedbackType === "Manager").length },
    ]}
    detailLines={[
      { label: "Type", key: "feedbackType" },
      { label: "Submitted by", key: "reviewer", type: "employee" },
    ]}
    statusColors={statusColors}
    emptyTitle="No feedback found"
    emptyDescription="Collect feedback to support performance reviews."
  />
);

export default FeedbackCollection;
