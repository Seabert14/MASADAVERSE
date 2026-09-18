const express = require("express");

const {
    getPayments,
    addPayment,
    updatePayment,
    deletePayment
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/", getPayments);
router.post("/", addPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

module.exports = router;