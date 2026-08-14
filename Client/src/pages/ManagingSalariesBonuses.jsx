import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { MoneyIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Draft: "bg-amber-50 text-amber-700",
  Approved: "bg-purple-50 text-purple-700",
  Paid: "bg-emerald-50 text-emerald-700",
};

const sumAmount = (records, status) =>
  records
    .filter((r) => !status || r.status === status)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

const ManagingSalariesBonuses = () => (
  <HRSectionCRUD
    title="Managing Salaries, Bonuses & Incentives"
    subtitle="Manage compensation components across the company"
    apiPath="payroll"
    listEndpoint="payroll-all"
    createEndpoint="payroll-post"
    updateEndpoint="payroll-update"
    deleteEndpoint="payroll-delete"
    addLabel="Add Payroll Entry"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "type", label: "Component", type: "select", options: ["salary", "bonus", "incentive"], required: true },
      { name: "amount", label: "Amount", type: "number", required: true, min: 0, placeholder: "0.00" },
      { name: "period", label: "Period (YYYY-MM)", type: "text", placeholder: "e.g. 2026-07" },
      { name: "paymentDate", label: "Payment date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Draft", "Approved", "Paid"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Payout", color: "brand", icon: <MoneyIcon />, get: (r) => sumAmount(r) },
      { label: "Approved", color: "blue", icon: <CheckIcon />, get: (r) => sumAmount(r, "Approved") },
      { label: "Paid", color: "green", icon: <ClockIcon />, get: (r) => sumAmount(r, "Paid") },
    ]}
    detailLines={[
      { label: "Component", key: "type" },
      { label: "Amount", key: "amount", type: "money" },
      { label: "Period", key: "period" },
      { label: "Payment", key: "paymentDate", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No payroll entries found"
    emptyDescription="Add salary, bonus, and incentive entries to manage compensation."
  />
);

export default ManagingSalariesBonuses;
