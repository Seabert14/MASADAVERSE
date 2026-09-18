const pool = require("../config/db");

const validateMember = ({
    member_name,
    member_email,
    member_gender,
    member_join_date,
    member_address,
    member_phone
}) => {
    if (!member_name || !member_name.trim()) {
        return "Member name is required";
    }

    if (!member_email || !member_email.trim()) {
        return "Member email is required";
    }

    if (!member_gender || !member_gender.trim()) {
        return "Member gender is required";
    }

    if (!member_join_date) {
        return "Join date is required";
    }

    if (!member_address || !member_address.trim()) {
        return "Member address is required";
    }

    if (!member_phone || !member_phone.trim()) {
        return "Member phone is required";
    }

    return null;
};

const getMembers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM member ORDER BY member_id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching members:", error);

        res.status(500).json({
            message: "Error fetching members"
        });
    }
};

const addMember = async (req, res) => {
    try {
        const {
            member_name,
            member_email,
            member_gender,
            member_join_date,
            member_address,
            member_phone
        } = req.body;

        const validationError = validateMember(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `INSERT INTO member
            (
                member_name,
                member_email,
                member_gender,
                member_join_date,
                member_address,
                member_phone
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                member_name.trim(),
                member_email.trim(),
                member_gender.trim(),
                member_join_date,
                member_address.trim(),
                member_phone.trim()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding member:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A member with this email already exists"
            });
        }

        res.status(500).json({
            message: "Error adding member"
        });
    }
};

const updateMember = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            member_name,
            member_email,
            member_gender,
            member_join_date,
            member_address,
            member_phone
        } = req.body;

        const validationError = validateMember(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `UPDATE member
            SET member_name = $1,
                member_email = $2,
                member_gender = $3,
                member_join_date = $4,
                member_address = $5,
                member_phone = $6
            WHERE member_id = $7
            RETURNING *`,
            [
                member_name.trim(),
                member_email.trim(),
                member_gender.trim(),
                member_join_date,
                member_address.trim(),
                member_phone.trim(),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating member:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A member with this email already exists"
            });
        }

        res.status(500).json({
            message: "Error updating member"
        });
    }
};

const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM member WHERE member_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json({
            message: "Member deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting member:", error);

        res.status(500).json({
            message: "Error deleting member"
        });
    }
};

module.exports = {
    getMembers,
    addMember,
    updateMember,
    deleteMember
};