const express = require("express");

const router = express.Router();

const {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise
} = require("../controllers/exerciseController");

router.get("/", getExercises);
router.get("/:id", getExerciseById);
router.post("/", createExercise);
router.put("/:id", updateExercise);
router.delete("/:id", deleteExercise);

module.exports = router;