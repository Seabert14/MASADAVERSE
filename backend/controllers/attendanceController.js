const pool = require("../config/db");

const validateAttendance = ({
    member_id,
    attendance_date,
    check_in_time,
    check_out_time,
    attendance_status
}) => {
    if (
        member_id === undefined ||
        member_id === null ||
        member_id === "" ||
        isNaN(Number(member_id))
    ) {
        return "Valid member is required";
    }

    if (!attendance_date) {
        return "Attendance date is required";
    }

    if (!check_in_time) {
        return "Check-in time is required";
    }

    if (!attendance_status || !attendance_status.trim()) {
        return "Attendance status is required";
    }

    if (
        check_out_time &&
        check_in_time &&
        check_out_time < check_in_time
    ) {
        return "Check-out time cannot be before check-in time";
    }

    return null;
};

const checkMemberExists = async (member_id) => {
    const result = await pool.query(
        "SELECT member_id FROM member WHERE member_id = $1",
        [member_id]
    );

    return result.rows.length > 0;
};

const getAttendance = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM attendance
             ORDER BY attendance_date DESC, attendance_id DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching attendance:", error);

        res.status(500).json({
            message: "Error fetching attendance"
        });
    }
};

const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid attendance ID"
            });
        }

        const result = await pool.query(
            "SELECT * FROM attendance WHERE attendance_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching attendance:", error);

        res.status(500).json({
            message: "Error fetching attendance"
        });
    }
};

const createAttendance = async (req, res) => {
    try {
        const {
            member_id,
            attendance_date,
            check_in_time,
            check_out_time,
            attendance_status
        } = req.body;

        const validationError = validateAttendance(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const memberExists = await checkMemberExists(member_id);

        if (!memberExists) {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        const result = await pool.query(
            `INSERT INTO attendance
            (
                member_id,
                attendance_date,
                check_in_time,
                check_out_time,
                attendance_status
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                Number(member_id),
                attendance_date,
                check_in_time,
                check_out_time || null,
                attendance_status.trim()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating attendance:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error creating attendance"
        });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid attendance ID"
            });
        }

        const {
            member_id,
            attendance_date,
            check_in_time,
            check_out_time,
            attendance_status
        } = req.body;

        const validationError = validateAttendance(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const memberExists = await checkMemberExists(member_id);

        if (!memberExists) {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        const result = await pool.query(
            `UPDATE attendance
             SET
                member_id = $1,
                attendance_date = $2,
                check_in_time = $3,
                check_out_time = $4,
                attendance_status = $5
             WHERE attendance_id = $6
             RETURNING *`,
            [
                Number(member_id),
                attendance_date,
                check_in_time,
                check_out_time || null,
                attendance_status.trim(),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating attendance:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Selected member does not exist"
            });
        }

        res.status(500).json({
            message: "Error updating attendance"
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid attendance ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM attendance WHERE attendance_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.json({
            message: "Attendance deleted successfully",
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting attendance:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this attendance record because related records exist"
            });
        }

        res.status(500).json({
            message: "Error deleting attendance"
        });
    }
};

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance
};