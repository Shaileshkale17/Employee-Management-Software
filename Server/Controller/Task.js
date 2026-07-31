import Task from "../model/Task.model.js";
import { Employee } from "../model/Employee.model.js";
import { Notification } from "../model/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, assignee, priority, dueDate } = req.body;
    if (!title?.trim()) {
      return res.status(400).json(new ApiError(400, "Title is required"));
    }
    if (assignee && !isValidObjectId(assignee)) {
      return res.status(400).json(new ApiError(400, "Invalid assignee"));
    }

    const data = await Task.create({
      companyId: req.companyId,
      title: title.trim(),
      description: description || "",
      assignee: assignee || null,
      createdBy: req.user.id,
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    if (assignee) {
      const assigneeDoc = await Employee.findById(assignee).select("name email");
      const creator = await Employee.findById(req.user.id).select("name");
      if (assigneeDoc && assigneeDoc.email) {
        await Notification.create({
          companyId: req.companyId,
          recipient: assignee,
          recipientModel: "Employee",
          title: "New Task Assigned",
          message: `${creator?.name || "Your manager"} assigned you a new task: "${data.title}".`,
          type: "system",
          link: "/task",
        });
      }
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "task.created",
      module: "task",
      targetType: "Task",
      targetId: data._id,
      details: `Created task "${data.title}"`,
      ip: req.ip,
    });

    return res.status(201).json(new ApiResponse(201, data, "Task created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = { companyId: req.companyId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) {
      if (!isValidObjectId(assignee)) return res.status(400).json(new ApiError(400, "Invalid assignee"));
      filter.assignee = assignee;
    }

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate("assignee", "name email employeeId designation")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Tasks fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = { companyId: req.companyId, assignee: req.user.id };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Tasks fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json(new ApiError(400, "Invalid task ID"));

    const task = await Task.findOne({ _id: id, companyId: req.companyId });
    if (!task) return res.status(404).json(new ApiError(404, "Task not found"));

    const allowed = ["title", "description", "assignee", "priority", "status", "dueDate"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) task[key] = req.body[key];
    }
    if (req.body.status === "Done" && !task.completedAt) {
      task.completedAt = new Date();
    }
    if (req.body.status && req.body.status !== "Done") {
      task.completedAt = null;
    }
    await task.save();

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "task.updated",
      module: "task",
      targetType: "Task",
      targetId: task._id,
      details: `Updated task "${task.title}"`,
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json(new ApiError(400, "Invalid task ID"));
    const task = await Task.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!task) return res.status(404).json(new ApiError(404, "Task not found"));

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "task.deleted",
      module: "task",
      targetType: "Task",
      targetId: task._id,
      details: `Deleted task "${task.title}"`,
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const filter = { companyId: req.companyId };
    const [todo, inProgress, inReview, done] = await Promise.all([
      Task.countDocuments({ ...filter, status: "Todo" }),
      Task.countDocuments({ ...filter, status: "In Progress" }),
      Task.countDocuments({ ...filter, status: "In Review" }),
      Task.countDocuments({ ...filter, status: "Done" }),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { todo, inProgress, inReview, done, total: todo + inProgress + inReview + done }, "Task stats fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
