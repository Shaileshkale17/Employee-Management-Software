import Event from "../model/Evemt.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
export const PostEvent = async (req, res, io) => {
  const { taskTitle, title, desc, StartDate, EndDate } = req.body;
  const data = await Event.create({
    taskTitle,
    title,
    desc,
    StartDate,
    EndDate,
  });

  if (!data) {
    return res.status(500).json(new ApiError(500, "Event creation failed"));
  }

  io.emit("New-Event-Add", {
    message: "All Employee have been retrieved",
    count: data.length,
    data,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Event create successfully"));
};

export const GetEvent = async (req, res, next) => {
  try {
    const data = await Event.find();
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event All successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
export const GetOneEvent = async (req, res, next) => {
  const { id } = req.params;
  try {
    const data = await Event.findById(id);
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event All successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
export const updateEvent = async (req, res, next) => {
  const { id } = req.params;
  const { taskTitle, title, desc, StartDate, EndDate } = req.body;

  try {
    const data = await Event.findByIdAndUpdate(
      id,
      {
        taskTitle,
        title,
        desc,
        StartDate,
        EndDate,
      },
      { new: true } // Return the updated document
    );
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
export const DeleteEvent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const data = await Event.findByIdAndDelete(id, { new: true });
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
