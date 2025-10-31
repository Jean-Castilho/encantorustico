import express from "express";
import { verifyOtp, resendOtp } from "../controllers/otpController.js";

const router = express.Router();

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

export default router;