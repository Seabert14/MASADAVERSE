const express = require("express");

const {
    getTrainers,
    addTrainer,
    updateTrainer,
    deleteTrainer
} = require("../controllers/trainerController");

const router = express.Router();

router.get("/", getTrainers);
router.post("/", addTrainer);
router.put("/:id", updateTrainer);
router.delete("/:id", deleteTrainer);

module.exports = router;