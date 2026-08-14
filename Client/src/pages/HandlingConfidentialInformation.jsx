import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { ShieldIcon, LockIcon, GlobeIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Review: "bg-amber-50 text-amber-700",
  Archived: "bg-ink-100 text-ink-600",
};

const HandlingConfidentialInformation = () => (
  <HRSectionCRUD
    title="Handling Confidential Information"
    subtitle="Manage sensitive employee information with controlled access"
    apiPath="emp-record"
    listEndpoint="record-all"
    createEndpoint="record-post"
    updateEndpoint="record-update"
    deleteEndpoint="record-delete"
    filterParam="category"
    filterValue="confidential"
    fixedValues={{ category: "confidential" }}
    addLabel="Add Confidential Record"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "Record title", type: "text", required: true, placeholder: "e.g. Medical records, background check" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What this confidential record contains" },
      { name: "accessLevel", label: "Access level", type: "select", options: ["Confidential", "Restricted", "General"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Access notes or handling instructions" },
    ]}
    stats={[
      { label: "Confidential", color: "red", icon: <ShieldIcon />, get: (r) => r.filter((x) => x.accessLevel === "Confidential").length },
      { label: "Restricted", color: "amber", icon: <LockIcon />, get: (r) => r.filter((x) => x.accessLevel === "Restricted").length },
      { label: "General", color: "gray", icon: <GlobeIcon />, get: (r) => r.filter((x) => x.accessLevel === "General").length },
    ]}
    detailLines={[
      { label: "Title", key: "title" },
      { label: "Access", key: "accessLevel" },
      { label: "Updated", key: "updatedAt", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No confidential records found"
    emptyDescription="Sensitive records will appear here with their access level."
  />
);

export default HandlingConfidentialInformation;
