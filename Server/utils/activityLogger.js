import { ActivityLog } from "../model/ActivityLog.model.js";

export const logActivity = async ({
  companyId,
  actor,
  action,
  module = "general",
  targetType = "",
  targetId = null,
  details = {},
  ip = "",
}) => {
  try {
    await ActivityLog.create({
      companyId: companyId || null,
      actor: actor || null,
      action,
      module,
      targetType,
      targetId: targetId || null,
      details,
      ip: ip || "",
    });
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};
