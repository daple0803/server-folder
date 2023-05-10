import express from "express"
import {
    creatOrder,
    getAdminOrders,
    getMyOrders,
    getOrderDetails,
    processOrder,
    processPayment,
} from "../controller/order.js"
import { isAuthenticated, isAdmin } from "../middlewares/auth.js"

const router = express.Router()

router.post("/new", isAuthenticated, creatOrder)
router.post("/payment", isAuthenticated, processPayment)

router.get("/myorder", isAuthenticated, getMyOrders)
router.get("/adminorder", isAuthenticated, isAdmin, getAdminOrders)

router
    .route("/single/:id")
    .get(isAuthenticated, getOrderDetails)
    .put(isAuthenticated, isAdmin, processOrder)

export default router
