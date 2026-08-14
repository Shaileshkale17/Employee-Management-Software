import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { GiftIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Expired: "bg-red-50 text-red-700",
};

const sumAmount = (records, status) =>
  records
    .filter((r) => !status || r.status === status)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

const OtherPerksReimbursements = () => (
  <HRSectionCRUD
    title="Other Perks & Reimbursements"
    subtitle="Track employee perks and reimbursement claims"
    apiPath="benefit"
    listEndpoint="benefit-all"
    createEndpoint="benefit-post"
    updateEndpoint="benefit-update"
    deleteEndpoint="benefit-delete"
    filterParam="type"
    filterValue="perks"
    fixedValues={{ type: "perks" }}
    addLabel="Add Perk / Claim"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "planName", label: "Perk / Claim title", type: "text", placeholder: "e.g. Gym membership, travel claim" },
      { name: "provider", label: "Provider", type: "text", placeholder: "e.g. Vendor or claim category" },
      { name: "amount", label: "Amount", type: "number", min: 0, placeholder: "0.00" },
      { name: "startDate", label: "Claim date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Pending", "Expired"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Claims", color: "brand", icon: <GiftIcon />, get: (r) => r.length },
      { label: "Pending", color: "amber", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Pending").length },
      { label: "Total Amount", color: "green", icon: <CheckIcon />, get: (r) => sumAmount(r) },
    ]}
    detailLines={[
      { label: "Perk / Claim", key: "planName" },
      { label: "Provider", key: "provider" },
      { label: "Amount", key: "amount", type: "money" },
      { label: "Date", key: "startDate", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No perks or claims found"
    emptyDescription="Add perks and reimbursement claims to track employee benefits."
  />
);

export default OtherPerksReimbursements;
