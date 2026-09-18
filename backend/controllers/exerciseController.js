const pool = require("../config/db");

const validateExercise = ({
    exercise_name,
    category_id,
    workout_id
}) => {
    if (!exercise_name || !exercise_name.trim()) {
        return "Exercise name is required";
    }

    if (
        category_id === undefined ||
        category_id === null ||
        category_id === "" ||
        isNaN(Number(category_id))
    ) {
        return "Valid category is required";
    }

    if (
        workout_id === undefined ||
        workout_id === null ||
        workout_id === "" ||
        isNaN(Number(workout_id))
    ) {
        return "Valid workout is required";
    }

    return null;
};

const getExercises = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                e.exercise_id,
                e.exercise_name,
                e.category_id,
                e.workout_id,
                ec.category_name
             FROM exercise e
             LEFT JOIN exercise_category ec
                ON e.category_id = ec.category_id
             ORDER BY e.exercise_id DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching exercises:", error);

        res.status(500).json({
            message: "Error fetching exercises"
        });
    }
};

const getExerciseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid exercise ID"
            });
        }

        const result = await pool.query(
            `SELECT
                e.exercise_id,
                e.exercise_name,
                e.category_id,
                e.workout_id,
                ec.category_name
             FROM exercise e
             LEFT JOIN exercise_category ec
                ON e.category_id = ec.category_id
             WHERE e.exercise_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Exercise not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching exercise:", error);

        res.status(500).json({
            message: "Error fetching exercise"
        });
    }
};

const createExercise = async (req, res) => {
    try {
        const {
            exercise_name,
            category_id,
            workout_id
        } = req.body;

        const validationError = validateExercise(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const categoryResult = await pool.query(
            "SELECT category_id FROM exercise_category WHERE category_id = $1",
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected category does not exist"
            });
        }

        const workoutResult = await pool.query(
            "SELECT workout_id FROM workout_plan WHERE workout_id = $1",
            [workout_id]
        );

        if (workoutResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected workout does not exist"
            });
        }

        const result = await pool.query(
            `INSERT INTO exercise
                (exercise_name, category_id, workout_id)
             VALUES
                ($1, $2, $3)
             RETURNING
                exercise_id,
                exercise_name,
                category_id,
                workout_id`,
            [
                exercise_name.trim(),
                Number(category_id),
                Number(workout_id)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating exercise:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Invalid category or workout selected"
            });
        }

        res.status(500).json({
            message: "Error creating exercise"
        });
    }
};

const updateExercise = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid exercise ID"
            });
        }

        const {
            exercise_name,
            category_id,
            workout_id
        } = req.body;

        const validationError = validateExercise(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const categoryResult = await pool.query(
            "SELECT category_id FROM exercise_category WHERE category_id = $1",
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected category does not exist"
            });
        }

        const workoutResult = await pool.query(
            "SELECT workout_id FROM workout_plan WHERE workout_id = $1",
            [workout_id]
        );

        if (workoutResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected workout does not exist"
            });
        }

        const result = await pool.query(
            `UPDATE exercise
             SET
                exercise_name = $1,
                category_id = $2,
                workout_id = $3
             WHERE exercise_id = $4
             RETURNING
                exercise_id,
                exercise_name,
                category_id,
                workout_id`,
            [
                exercise_name.trim(),
                Number(category_id),
                Number(workout_id),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Exercise not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating exercise:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Invalid category or workout selected"
            });
        }

        res.status(500).json({
            message: "Error updating exercise"
        });
    }
};

const deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid exercise ID"
            });
        }

        const result = await pool.query(
            `DELETE FROM exercise
             WHERE exercise_id = $1
             RETURNING exercise_id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Exercise not found"
            });
        }

        res.json({
            message: "Exercise deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting exercise:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this exercise because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting exercise"
        });
    }
};

module.exports = {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise
};