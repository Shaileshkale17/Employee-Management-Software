import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({ status: 401, message: "tocken not found" });
  }
  try {
    let verifyed = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verifyed;
    next();
  } catch (error) {
    return res.status(400).json({ status: 400, message: "Invalid Tocken" });
  }
};
