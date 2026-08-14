import HRSectionCRUD from "../components/hr/HRSectionCRUD";
import { FolderIcon, CheckIcon, ClockIcon } from "../components/hr/icons";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700",
  Review: "bg-amber-50 text-amber-700",
  Archived: "bg-ink-100 text-ink-600",
};

const MaintainingEmployeeFiles = () => (
  <HRSectionCRUD
    title="Maintaining Employee Files"
    subtitle="Organize and maintain employee personnel files"
    apiPath="emp-record"
    listEndpoint="record-all"
    createEndpoint="record-post"
    updateEndpoint="record-update"
    deleteEndpoint="record-delete"
    filterParam="category"
    filterValue="maintaining-files"
    fixedValues={{ category: "maintaining-files" }}
    addLabel="Add File Record"
    fields={[
      { name: "employee", label: "Employee", type: "employee", required: true },
      { name: "title", label: "File / Document title", type: "text", required: true, placeholder: "e.g. Offer letter, ID proof" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What this file contains" },
      { name: "accessLevel", label: "Access level", type: "select", options: ["General", "Restricted", "Confidential"] },
      { name: "status", label: "Status", type: "select", options: ["Active", "Review", "Archived"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    ]}
    stats={[
      { label: "Total Files", color: "brand", icon: <FolderIcon />, get: (r) => r.length },
      { label: "Active", color: "green", icon: <CheckIcon />, get: (r) => r.filter((x) => x.status === "Active").length },
      { label: "Archived", color: "gray", icon: <ClockIcon />, get: (r) => r.filter((x) => x.status === "Archived").length },
    ]}
    detailLines={[
      { label: "Title", key: "title" },
      { label: "Access", key: "accessLevel" },
      { label: "Updated", key: "updatedAt", type: "date" },
    ]}
    statusColors={statusColors}
    emptyTitle="No file records found"
    emptyDescription="Add personnel file records to start maintaining employee files."
  />
);

export default MaintainingEmployeeFiles;
