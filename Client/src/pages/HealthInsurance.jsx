import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { HeartIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Expired: "bg-red-50 text-red-700",
};

const sumField = (records, key, status) =>
  records
    .filter((r) => !status || r.status === status)
    .reduce((sum, r) => sum + (Number(r[key]) || 0), 0);

const HealthInsurance = () => (
  <HRSectionCRUD
    title="Health Insurance"
    subtitle="Manage employee health insurance policies"
    apiPath="benefit"
    listEndpoint="benefit-all"
    createEndpoint="benefit-post"
    updateEndpoint="benefit-update"
    deleteEndpoint="benefit-delete"
    filterParam="type"
    filterValue="health-insurance"
    fixedValues={{ type: "health-insurance" }}
    addLabel="Add Insurance Policy"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "planName", label: "Plan name", type: "text", placeholder: "e.g. Family Floater" },
      { name: "provider", label: "Provider", type: "text", placeholder: "e.g. Star Health" },
      { name: "policyNumber", label: "Policy number", type: "text", placeholder: "e.g. POL-2026-001" },
      { name: "amount", label: "Premium amount", type: "number", min: 0, placeholder: "0.00" },
      { name: "coverage", label: "Coverage amount", type: "number", min: 0, placeholder: "0.00" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Pending", "Expired"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Policies", color: "brand", icon: <HeartIcon />, get: (r) => r.length },
      { label: "Active", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Active").length },
      { label: "Total Premium", color: "red", icon: <ClockIcon />, get: (r) => sumField(r, "amount") },
    ]}
    detailLines={[
      { label: "Plan", key: "planName" },
      { label: "Provider", key: "provider" },
      { label: "Policy", key: "policyNumber" },
      { label: "Premium", key: "amount", type: "money" },
      { label: "Coverage", key: "coverage", type: "money" },
    ]}
    statusColors={statusColors}
    emptyTitle="No insurance policies found"
    emptyDescription="Add health insurance policies to track employee coverage."
  />
);

export default HealthInsurance;
