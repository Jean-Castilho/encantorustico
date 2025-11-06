import express from "express";
import { verifyOtp, resendOtp } from "../controllers/otpController.js";

const router = express.Router();

router.post("/verify-otp", verifyOtp);
router.get("/resend-otp/:contact", resendOtp);

export default router;