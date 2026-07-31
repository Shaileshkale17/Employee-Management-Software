import { Notification } from "../model/Notification.model.js";

export const notify = async ({
  io,
  recipient,
  recipientModel = "Employee",
  companyId,
  title = "",
  message,
  type = "info",
  link = "",
}) => {
  try {
    if (!recipient) return null;
    const data = await Notification.create({
      recipient,
      recipientModel,
      companyId,
      title,
      message,
      type,
      link,
    });
    if (io) {
      io.emit("notification:new", {
        recipient: String(recipient),
        notification: data,
      });
    }
    return data;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};
