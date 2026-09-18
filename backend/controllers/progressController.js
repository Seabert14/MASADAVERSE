const pool = require("../config/db");

const validateProgress = ({
    member_id,
    record_date,
    weight,
    height,
    body_fat
}) => {
    if (
        member_id === undefined ||
        member_id === null ||
        member_id === "" ||
        isNaN(Number(member_id))
    ) {
        return "Valid member is required";
    }

    if (!record_date) {
        return "Record date is required";
    }

    if (
        weight === undefined ||
        weight === null ||
        weight === "" ||
        isNaN(Number(weight)) ||
        Number(weight) <= 0
    ) {
        return "Weight must be greater than 0";
    }

    if (
        height === undefined ||
        height === null ||
        height === "" ||
        isNaN(Number(height)) ||
        Number(height) <= 0
    ) {
        return "Height must be greater than 0";
    }

    if (
        body_fat === undefined ||
        body_fat === null ||
        body_fat === "" ||
        isNaN(Number(body_fat)) ||
        Number(body_fat) < 0 ||
        Number(body_fat) > 100
    ) {
        return "Body fat must be between 0 and 100";
    }

    return null;
};

const getProgress = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM progress ORDER BY progress_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching progress:", error);

        res.status(500).json({
            message: "Error fetching progress"
        });
    }
};

const addProgress = async (req, res) => {
    try {
        const {
            member_id,
            record_date,
            weight,
            height,
            body_fat
        } = req.body;

        const validationError = validateProgress(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const memberResult = await pool.query(
            "SELECT member_id FROM member WHERE member_id = $1",
            [member_id]
        );

        if (memberResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        const result = await pool.query(
            `INSERT INTO progress
            (member_id, record_date, weight, height, body_fat)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                Number(member_id),
                record_date,
                Number(weight),
                Number(height),
                Number(body_fat)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding progress:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error adding progress"
        });
    }
};

const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid progress ID"
            });
        }

        const {
            member_id,
            record_date,
            weight,
            height,
            body_fat
        } = req.body;

        const validationError = validateProgress(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const memberResult = await pool.query(
            "SELECT member_id FROM member WHERE member_id = $1",
            [member_id]
        );

        if (memberResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        const result = await pool.query(
            `UPDATE progress
            SET
                member_id = $1,
                record_date = $2,
                weight = $3,
                height = $4,
                body_fat = $5
            WHERE progress_id = $6
            RETURNING *`,
            [
                Number(member_id),
                record_date,
                Number(weight),
                Number(height),
                Number(body_fat),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Progress record not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating progress:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error updating progress"
        });
    }
};

const deleteProgress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid progress ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM progress WHERE progress_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Progress record not found"
            });
        }

        res.json({
            message: "Progress deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting progress:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this progress record because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting progress"
        });
    }
};

module.exports = {
    getProgress,
    addProgress,
    updateProgress,
    deleteProgress
};