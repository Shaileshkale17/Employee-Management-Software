import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { PiggyBankIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Expired: "bg-red-50 text-red-700",
};

const sumAmount = (records, status) =>
  records
    .filter((r) => !status || r.status === status)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

const ProvidentFundGratuity = () => (
  <HRSectionCRUD
    title="Provident Fund & Gratuity"
    subtitle="Manage PF contributions and gratuity eligibility"
    apiPath="benefit"
    listEndpoint="benefit-all"
    createEndpoint="benefit-post"
    updateEndpoint="benefit-update"
    deleteEndpoint="benefit-delete"
    filterParam="type"
    filterValue="provident-fund"
    fixedValues={{ type: "provident-fund" }}
    addLabel="Add PF Record"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "planName", label: "Plan name", type: "text", placeholder: "e.g. EPF / Gratuity" },
      { name: "policyNumber", label: "PF / UAN number", type: "text", placeholder: "e.g. UAN 100123456789" },
      { name: "amount", label: "Contribution amount", type: "number", min: 0, placeholder: "0.00" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Pending", "Expired"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Records", color: "brand", icon: <PiggyBankIcon />, get: (r) => r.length },
      { label: "Active", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Active").length },
      { label: "Total Contribution", color: "amber", icon: <ClockIcon />, get: (r) => sumAmount(r) },
    ]}
    detailLines={[
      { label: "Plan", key: "planName" },
      { label: "PF / UAN", key: "policyNumber" },
      { label: "Contribution", key: "amount", type: "money" },
      { label: "Start", key: "startDate", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No PF / gratuity records found"
    emptyDescription="Add provident fund and gratuity records for employees."
  />
);

export default ProvidentFundGratuity;
