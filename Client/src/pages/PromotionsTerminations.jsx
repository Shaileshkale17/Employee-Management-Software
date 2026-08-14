import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { TrendUpIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-purple-50 text-purple-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const PromotionsTerminations = () => (
  <HRSectionCRUD
    title="Promotions & Terminations"
    subtitle="Track role changes across the company"
    apiPath="performance"
    listEndpoint="performance-all"
    createEndpoint="performance-post"
    updateEndpoint="performance-update"
    deleteEndpoint="performance-delete"
    filterParam="type"
    filterValue="promotion"
    fixedValues={{ type: "promotion" }}
    addLabel="Add Role Change"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Promotion to Senior Engineer" },
      { name: "fromRole", label: "From role", type: "text", placeholder: "e.g. Engineer" },
      { name: "toRole", label: "To role", type: "text", placeholder: "e.g. Senior Engineer" },
      { name: "effectiveDate", label: "Effective date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed", "Approved", "Rejected"] },
      { name: "description", label: "Reason / notes", type: "textarea", placeholder: "Reason for the role change" },
    ]}
    stats={[
      { label: "Total Changes", color: "brand", icon: <TrendUpIcon />, get: (r) => r.length },
      { label: "Pending", color: "amber", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Pending").length },
      { label: "Approved", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Approved").length },
    ]}
    detailLines={[
      { label: "From", key: "fromRole" },
      { label: "To", key: "toRole" },
      { label: "Effective", key: "effectiveDate", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No role changes found"
    emptyDescription="Track promotions and terminations to keep roles current."
  />
);

export default PromotionsTerminations;
