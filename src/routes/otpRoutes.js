import express from "express";
import { getOtpPage, resendOtp, sendOtp, verifyOtp } from "../controllers/otpController.js";

const router = express.Router();

router.get('/otpCode', getOtpPage);
router.get("/resendOtp/:email", resendOtp);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);



export default router;