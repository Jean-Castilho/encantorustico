import express from "express";
const router = express.Router();

import deliveryController from "../controllers/deliveryContoller.js";

const deliverycontroller = new deliveryController();

router.get("/delivery", deliverycontroller.getDeliveryPage);

export default router;