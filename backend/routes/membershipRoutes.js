const express = require("express");

const {
    getMemberships,
    addMembership,
    updateMembership,
    deleteMembership
} = require("../controllers/membershipController");

const router = express.Router();

router.get("/", getMemberships);
router.post("/", addMembership);
router.put("/:id", updateMembership);
router.delete("/:id", deleteMembership);

module.exports = router;