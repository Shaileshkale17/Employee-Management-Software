import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { RefreshIcon, ClockIcon, CheckIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Review: "bg-amber-50 text-amber-700",
  Archived: "bg-ink-100 text-ink-600",
};

const KeepingRecordsUpdated = () => (
  <HRSectionCRUD
    title="Keeping Records Updated"
    subtitle="Track and keep employee records current"
    apiPath="emp-record"
    listEndpoint="record-all"
    createEndpoint="record-post"
    updateEndpoint="record-update"
    deleteEndpoint="record-delete"
    filterParam="category"
    filterValue="records-updated"
    fixedValues={{ category: "records-updated" }}
    addLabel="Add Record Update"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Record / Change title", type: "text", required: true, placeholder: "e.g. Address change, promotion note" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What changed in this record" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Review", "Archived"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Updates", color: "brand", icon: <RefreshIcon />, get: (r) => r.length },
      { label: "Under Review", color: "amber", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Review").length },
      { label: "Current", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Active").length },
    ]}
    detailLines={[
      { label: "Title", key: "title" },
      { label: "Updated", key: "updatedAt", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No update records found"
    emptyDescription="Track record changes here to keep employee files current."
  />
);

export default KeepingRecordsUpdated;
