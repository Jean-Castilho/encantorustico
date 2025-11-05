import express from "express";
import { checkUserRole } from "../middleware/authMiddleware.js";
const router = express.Router();

import deliveryController from "../controllers/deliveryContoller.js";

const deliverycontroller = new deliveryController();

router.use(checkUserRole);

router.get("/delivery", deliverycontroller.getDeliveryPage);

export default router;