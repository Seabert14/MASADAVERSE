const pool = require("../config/db");

const validateWorkout = ({ workout_name, trainer_id }) => {
    if (!workout_name || !workout_name.trim()) {
        return "Workout name is required";
    }

    if (
        trainer_id === undefined ||
        trainer_id === null ||
        trainer_id === "" ||
        isNaN(Number(trainer_id))
    ) {
        return "Valid trainer is required";
    }

    return null;
};

const getWorkouts = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM workout_plan ORDER BY workout_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching workouts:", error);

        res.status(500).json({
            message: "Error fetching workouts"
        });
    }
};

const addWorkout = async (req, res) => {
    try {
        const {
            workout_name,
            trainer_id
        } = req.body;

        const validationError = validateWorkout(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const trainerResult = await pool.query(
            "SELECT trainer_id FROM trainer WHERE trainer_id = $1",
            [trainer_id]
        );

        if (trainerResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected trainer does not exist"
            });
        }

        const result = await pool.query(
            `INSERT INTO workout_plan
            (
                workout_name,
                trainer_id
            )
            VALUES ($1, $2)
            RETURNING *`,
            [
                workout_name.trim(),
                Number(trainer_id)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding workout:", error);

        res.status(500).json({
            message: "Error adding workout"
        });
    }
};

const updateWorkout = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid workout ID"
            });
        }

        const {
            workout_name,
            trainer_id
        } = req.body;

        const validationError = validateWorkout(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const trainerResult = await pool.query(
            "SELECT trainer_id FROM trainer WHERE trainer_id = $1",
            [trainer_id]
        );

        if (trainerResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected trainer does not exist"
            });
        }

        const result = await pool.query(
            `UPDATE workout_plan
            SET
                workout_name = $1,
                trainer_id = $2
            WHERE workout_id = $3
            RETURNING *`,
            [
                workout_name.trim(),
                Number(trainer_id),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Workout not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating workout:", error);

        res.status(500).json({
            message: "Error updating workout"
        });
    }
};

const deleteWorkout = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid workout ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM workout_plan WHERE workout_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Workout not found"
            });
        }

        res.json({
            message: "Workout deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting workout:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this workout because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting workout"
        });
    }
};

module.exports = {
    getWorkouts,
    addWorkout,
    updateWorkout,
    deleteWorkout
};