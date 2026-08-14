import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { TargetIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-purple-50 text-purple-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const GoalSetting = () => (
  <HRSectionCRUD
    title="Goal Setting"
    subtitle="Set and track employee performance goals"
    apiPath="performance"
    listEndpoint="performance-all"
    createEndpoint="performance-post"
    updateEndpoint="performance-update"
    deleteEndpoint="performance-delete"
    filterParam="type"
    filterValue="goal"
    fixedValues={{ type: "goal" }}
    addLabel="Add Goal"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Goal title", type: "text", required: true, placeholder: "e.g. Ship Q3 feature" },
      { name: "targetDate", label: "Target date", type: "date" },
      { name: "progress", label: "Progress (%)", type: "number", min: 0, max: 100, placeholder: "0" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed", "Approved", "Rejected"] },
      { name: "description", label: "Description", type: "textarea", placeholder: "What does success look like?" },
    ]}
    stats={[
      { label: "Total Goals", color: "brand", icon: <TargetIcon />, get: (r) => r.length },
      { label: "In Progress", color: "blue", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "In Progress").length },
      { label: "Completed", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Completed").length },
    ]}
    detailLines={[
      { label: "Target date", key: "targetDate", type: "date" },
      { label: "Progress", key: "progress", type: "percent" },
    ]}
    statusColors={statusColors}
    emptyTitle="No goals found"
    emptyDescription="Add goals to help employees stay focused."
  />
);

export default GoalSetting;
