const pool = require("../config/db");

const validateTrainer = ({
    trainer_name,
    trainer_email,
    trainer_phone,
    trainer_specialization
}) => {
    if (!trainer_name || !trainer_name.trim()) {
        return "Trainer name is required";
    }

    if (!trainer_email || !trainer_email.trim()) {
        return "Trainer email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trainer_email.trim())) {
        return "Invalid email address";
    }

    if (!trainer_phone || !trainer_phone.trim()) {
        return "Trainer phone is required";
    }

    if (!trainer_specialization || !trainer_specialization.trim()) {
        return "Trainer specialization is required";
    }

    return null;
};

const getTrainers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM trainer ORDER BY trainer_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching trainers:", error);

        res.status(500).json({
            message: "Error fetching trainers"
        });
    }
};

const addTrainer = async (req, res) => {
    try {
        const {
            trainer_name,
            trainer_email,
            trainer_phone,
            trainer_specialization
        } = req.body;

        const validationError = validateTrainer(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `INSERT INTO trainer
            (
                trainer_name,
                trainer_email,
                trainer_phone,
                trainer_specialization
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                trainer_name.trim(),
                trainer_email.trim(),
                trainer_phone.trim(),
                trainer_specialization.trim()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding trainer:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A trainer with this email already exists"
            });
        }

        res.status(500).json({
            message: "Error adding trainer"
        });
    }
};

const updateTrainer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid trainer ID"
            });
        }

        const {
            trainer_name,
            trainer_email,
            trainer_phone,
            trainer_specialization
        } = req.body;

        const validationError = validateTrainer(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `UPDATE trainer
            SET
                trainer_name = $1,
                trainer_email = $2,
                trainer_phone = $3,
                trainer_specialization = $4
            WHERE trainer_id = $5
            RETURNING *`,
            [
                trainer_name.trim(),
                trainer_email.trim(),
                trainer_phone.trim(),
                trainer_specialization.trim(),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Trainer not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating trainer:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A trainer with this email already exists"
            });
        }

        res.status(500).json({
            message: "Error updating trainer"
        });
    }
};

const deleteTrainer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid trainer ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM trainer WHERE trainer_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Trainer not found"
            });
        }

        res.json({
            message: "Trainer deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting trainer:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this trainer because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting trainer"
        });
    }
};

module.exports = {
    getTrainers,
    addTrainer,
    updateTrainer,
    deleteTrainer
};