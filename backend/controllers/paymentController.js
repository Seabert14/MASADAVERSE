const pool = require("../config/db");

const validatePayment = ({
    payment_date,
    payment_type,
    plan_id,
    plan_amount
}) => {
    if (!payment_date) {
        return "Payment date is required";
    }

    if (!payment_type || !payment_type.trim()) {
        return "Payment type is required";
    }

    if (
        plan_id === undefined ||
        plan_id === null ||
        plan_id === "" ||
        isNaN(Number(plan_id))
    ) {
        return "Valid membership is required";
    }

    if (
        plan_amount === undefined ||
        plan_amount === null ||
        plan_amount === ""
    ) {
        return "Payment amount is required";
    }

    if (isNaN(Number(plan_amount)) || Number(plan_amount) <= 0) {
        return "Payment amount must be greater than 0";
    }

    return null;
};

const getPayments = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM payment ORDER BY payment_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payments:", error);

        res.status(500).json({
            message: "Error fetching payments"
        });
    }
};

const addPayment = async (req, res) => {
    try {
        const {
            payment_date,
            payment_type,
            plan_id,
            plan_amount
        } = req.body;

        const validationError = validatePayment(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const membershipResult = await pool.query(
            "SELECT plan_amount FROM membership_plan WHERE plan_id = $1",
            [plan_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected membership does not exist"
            });
        }

        const membershipAmount = Number(
            membershipResult.rows[0].plan_amount
        );

        if (Number(plan_amount) !== membershipAmount) {
            return res.status(400).json({
                message: "Payment amount does not match the membership amount"
            });
        }

        const result = await pool.query(
            `INSERT INTO payment
            (
                payment_date,
                payment_type,
                plan_id,
                plan_amount
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                payment_date,
                payment_type.trim(),
                Number(plan_id),
                membershipAmount
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding payment:", error);

        res.status(500).json({
            message: "Error adding payment"
        });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }

        const {
            payment_date,
            payment_type,
            plan_id,
            plan_amount
        } = req.body;

        const validationError = validatePayment(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const membershipResult = await pool.query(
            "SELECT plan_amount FROM membership_plan WHERE plan_id = $1",
            [plan_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(400).json({
                message: "Selected membership does not exist"
            });
        }

        const membershipAmount = Number(
            membershipResult.rows[0].plan_amount
        );

        if (Number(plan_amount) !== membershipAmount) {
            return res.status(400).json({
                message: "Payment amount does not match the membership amount"
            });
        }

        const result = await pool.query(
            `UPDATE payment
            SET
                payment_date = $1,
                payment_type = $2,
                plan_id = $3,
                plan_amount = $4
            WHERE payment_id = $5
            RETURNING *`,
            [
                payment_date,
                payment_type.trim(),
                Number(plan_id),
                membershipAmount,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating payment:", error);

        res.status(500).json({
            message: "Error updating payment"
        });
    }
};

const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM payment WHERE payment_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json({
            message: "Payment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting payment:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this payment because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting payment"
        });
    }
};

module.exports = {
    getPayments,
    addPayment,
    updatePayment,
    deletePayment
};