import express from "express";
import {
  CreateOnboarding,
  GetAllOnboarding,
  GetOneOnboarding,
  UpdateOnboarding,
  DeleteOnboarding,
  UpdateDocumentStatus,
  UpdateSystemAccessStatus,
  UpdateWelcomeKitStatus,
} from "../Controller/Onboarding.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/onboarding-post", (req, res) => CreateOnboarding(req, res));
router.get("/onboarding-all", (req, res) => GetAllOnboarding(req, res));
router.get("/onboarding-get/:id", (req, res) => GetOneOnboarding(req, res));
router.put("/onboarding-update/:id", (req, res) => UpdateOnboarding(req, res));
router.delete("/onboarding-delete/:id", (req, res) => DeleteOnboarding(req, res));

router.put("/onboarding-doc/:id/:docId", (req, res) => UpdateDocumentStatus(req, res));
router.put("/onboarding-access/:id/:accessId", (req, res) => UpdateSystemAccessStatus(req, res));
router.put("/onboarding-welcomekit/:id", (req, res) => UpdateWelcomeKitStatus(req, res));

export default router;
