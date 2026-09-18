const express = require("express");

const {
    getWorkouts,
    addWorkout,
    updateWorkout,
    deleteWorkout
} = require("../controllers/workoutController");

const router = express.Router();

router.get("/", getWorkouts);
router.post("/", addWorkout);
router.put("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

module.exports = router;