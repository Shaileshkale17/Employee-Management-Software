import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { ClockIcon, CheckIcon, TrendUpIcon } from "../components/hr/icons";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700",
  Sent: "bg-purple-50 text-purple-700",
  Confirmed: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const sumAmount = (records, status) =>
  records
    .filter((r) => !status || r.status === status)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

const CoordinatingWithFinance = () => (
  <HRSectionCRUD
    title="Coordinating with Finance"
    subtitle="Share and confirm payroll data with the finance team"
    apiPath="finance"
    listEndpoint="finance-all"
    createEndpoint="finance-post"
    updateEndpoint="finance-update"
    deleteEndpoint="finance-delete"
    addLabel="Add Finance Record"
    fields={[
      { name: "employee", label: "Employee", type: "employee" },
      { name: "recordType", label: "Record type", type: "select", options: ["Salary", "Bonus", "Incentive", "Reimbursement", "Other"] },
      { name: "amount", label: "Amount", type: "number", min: 0, placeholder: "0.00" },
      { name: "period", label: "Period (YYYY-MM)", type: "text", placeholder: "e.g. 2026-07" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Sent", "Confirmed", "Rejected"] },
      { name: "financeContact", label: "Finance contact", type: "text", placeholder: "e.g. accounts@company.com" },
      { name: "sentAt", label: "Sent on", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Coordination notes" },
    ]}
    stats={[
      { label: "Pending", color: "amber", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Pending").length },
      { label: "Sent", color: "blue", icon: <TrendUpIcon />, get: (r) => r.filter((x) => x.status === "Sent").length },
      { label: "Confirmed", color: "green", icon: <CheckIcon />, get: (r) => sumAmount(r, "Confirmed") },
    ]}
    detailLines={[
      { label: "Type", key: "recordType" },
      { label: "Amount", key: "amount", type: "money" },
      { label: "Period", key: "period" },
      { label: "Contact", key: "financeContact" },
      { label: "Sent", key: "sentAt", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No finance records found"
    emptyDescription="Track payroll coordination with the finance team here."
  />
);

export default CoordinatingWithFinance;
