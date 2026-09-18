const express = require("express");

const {
    getProgress,
    addProgress,
    updateProgress,
    deleteProgress
} = require("../controllers/progressController");

const router = express.Router();

router.get("/", getProgress);
router.post("/", addProgress);
router.put("/:id", updateProgress);
router.delete("/:id", deleteProgress);

module.exports = router;