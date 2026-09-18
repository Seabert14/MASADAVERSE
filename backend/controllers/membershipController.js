const pool = require("../config/db");

const validateMembership = ({
    plan_name,
    plan_amount,
    plan_duration,
    plan_start_date,
    plan_end_date,
    member_id
}) => {
    if (!plan_name || !plan_name.trim()) {
        return "Plan name is required";
    }

    if (plan_amount === undefined || plan_amount === null || plan_amount === "") {
        return "Plan amount is required";
    }

    if (isNaN(Number(plan_amount)) || Number(plan_amount) < 0) {
        return "Plan amount must be a valid non-negative number";
    }

    if (plan_duration === undefined || plan_duration === null || plan_duration === "") {
        return "Plan duration is required";
    }

    if (isNaN(Number(plan_duration)) || Number(plan_duration) <= 0) {
        return "Plan duration must be greater than 0";
    }

    if (!plan_start_date) {
        return "Plan start date is required";
    }

    if (!plan_end_date) {
        return "Plan end date is required";
    }

    if (new Date(plan_end_date) < new Date(plan_start_date)) {
        return "Plan end date cannot be before start date";
    }

    if (
        member_id === undefined ||
        member_id === null ||
        member_id === "" ||
        isNaN(Number(member_id))
    ) {
        return "Valid member is required";
    }

    return null;
};

const getMemberships = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM membership_plan ORDER BY plan_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching memberships:", error);

        res.status(500).json({
            message: "Error fetching memberships"
        });
    }
};

const addMembership = async (req, res) => {
    try {
        const {
            plan_name,
            plan_amount,
            plan_duration,
            plan_start_date,
            plan_end_date,
            member_id
        } = req.body;

        const validationError = validateMembership(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `INSERT INTO membership_plan
            (
                plan_name,
                plan_amount,
                plan_duration,
                plan_start_date,
                plan_end_date,
                member_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                plan_name.trim(),
                Number(plan_amount),
                Number(plan_duration),
                plan_start_date,
                plan_end_date,
                Number(member_id)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding membership:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error adding membership"
        });
    }
};

const updateMembership = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid membership ID"
            });
        }

        const {
            plan_name,
            plan_amount,
            plan_duration,
            plan_start_date,
            plan_end_date,
            member_id
        } = req.body;

        const validationError = validateMembership(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `UPDATE membership_plan
            SET
                plan_name = $1,
                plan_amount = $2,
                plan_duration = $3,
                plan_start_date = $4,
                plan_end_date = $5,
                member_id = $6
            WHERE plan_id = $7
            RETURNING *`,
            [
                plan_name.trim(),
                Number(plan_amount),
                Number(plan_duration),
                plan_start_date,
                plan_end_date,
                Number(member_id),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Membership not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating membership:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error updating membership"
        });
    }
};

const deleteMembership = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid membership ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM membership_plan WHERE plan_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Membership not found"
            });
        }

        res.json({
            message: "Membership deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting membership:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this membership because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting membership"
        });
    }
};

module.exports = {
    getMemberships,
    addMembership,
    updateMembership,
    deleteMembership
};