import express from "express";
import {
  CreateBenefit,
  GetAllBenefits,
  GetOneBenefit,
  UpdateBenefit,
  DeleteBenefit,
} from "../Controller/Benefit.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/benefit-post", (req, res) => CreateBenefit(req, res));
router.get("/benefit-all", (req, res) => GetAllBenefits(req, res));
router.get("/benefit-get/:id", (req, res) => GetOneBenefit(req, res));
router.put("/benefit-update/:id", (req, res) => UpdateBenefit(req, res));
router.delete("/benefit-delete/:id", (req, res) => DeleteBenefit(req, res));

export default router;
