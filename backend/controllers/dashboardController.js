const pool = require("../config/db");

const isValidDate = (date) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !isNaN(new Date(`${date}T00:00:00`).getTime());
};

const getDashboardStats = async (req, res) => {
    try {
        const selectedDate =
            req.query.date || new Date().toISOString().split("T")[0];

        if (!isValidDate(selectedDate)) {
            return res.status(400).json({
                message: "Invalid date. Use YYYY-MM-DD format"
            });
        }

        const membersResult = await pool.query(
            "SELECT COUNT(*) AS total_members FROM member"
        );

        const activeMembershipsResult = await pool.query(
            `SELECT COUNT(*) AS active_memberships
             FROM membership_plan
             WHERE plan_start_date <= $1
             AND plan_end_date >= $1`,
            [selectedDate]
        );

        const expiredMembershipsResult = await pool.query(
            `SELECT COUNT(*) AS expired_memberships
             FROM membership_plan
             WHERE plan_end_date < $1`,
            [selectedDate]
        );

        const trainersResult = await pool.query(
            "SELECT COUNT(*) AS total_trainers FROM trainer"
        );

        const paymentsResult = await pool.query(
            `SELECT COALESCE(SUM(plan_amount), 0) AS total_payments
             FROM payment`
        );

        const workoutsResult = await pool.query(
            "SELECT COUNT(*) AS total_workouts FROM workout_plan"
        );

        const progressResult = await pool.query(
            "SELECT COUNT(*) AS total_progress FROM progress"
        );

        const attendanceResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (
                    WHERE attendance_date = $1
                    AND attendance_status = 'Present'
                ) AS present_today,

                COUNT(*) FILTER (
                    WHERE attendance_date = $1
                ) AS total_attendance_today
             FROM attendance`,
            [selectedDate]
        );

        const upcomingExpiryResult = await pool.query(
            `SELECT COUNT(*) AS upcoming_expiry
             FROM membership_plan
             WHERE plan_end_date >= $1
             AND plan_end_date <= $1::date + INTERVAL '7 days'`,
            [selectedDate]
        );

        const membershipGrowthResult = await pool.query(
            `SELECT
                TO_CHAR(
                    DATE_TRUNC('month', member_join_date),
                    'Mon'
                ) AS month,
                COUNT(*) AS members
             FROM member
             WHERE member_join_date >=
                DATE_TRUNC('month', $1::date) - INTERVAL '5 months'
             AND member_join_date <= $1::date
             GROUP BY DATE_TRUNC('month', member_join_date)
             ORDER BY DATE_TRUNC('month', member_join_date)`,
            [selectedDate]
        );

        const recentMembersResult = await pool.query(
            `SELECT
                m.member_id,
                m.member_name,
                m.member_join_date,
                (
                    SELECT mp.plan_name
                    FROM membership_plan mp
                    WHERE mp.member_id = m.member_id
                    ORDER BY mp.plan_end_date DESC NULLS LAST,
                             mp.plan_id DESC
                    LIMIT 1
                ) AS plan_name
             FROM member m
             ORDER BY m.member_join_date DESC, m.member_id DESC
             LIMIT 4`
        );

        const activeMemberships =
            Number(activeMembershipsResult.rows[0].active_memberships);

        const presentToday =
            Number(attendanceResult.rows[0].present_today);

        const totalAttendanceToday =
            Number(attendanceResult.rows[0].total_attendance_today);

        const attendancePercentage =
            totalAttendanceToday > 0
                ? Math.round(
                    (presentToday / totalAttendanceToday) * 100
                )
                : 0;

        res.json({
            selected_date: selectedDate,

            total_members:
                Number(membersResult.rows[0].total_members),

            active_memberships:
                activeMemberships,

            expired_memberships:
                Number(
                    expiredMembershipsResult.rows[0].expired_memberships
                ),

            total_trainers:
                Number(trainersResult.rows[0].total_trainers),

            total_payments:
                Number(paymentsResult.rows[0].total_payments),

            total_workouts:
                Number(workoutsResult.rows[0].total_workouts),

            present_today:
                presentToday,

            total_attendance_today:
                totalAttendanceToday,

            attendance_percentage:
                attendancePercentage,

            total_progress:
                Number(progressResult.rows[0].total_progress),

            membership_growth:
                membershipGrowthResult.rows,

            recent_members:
                recentMembersResult.rows,

            upcoming_expiry:
                Number(
                    upcomingExpiryResult.rows[0].upcoming_expiry
                )
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);

        res.status(500).json({
            message: "Error fetching dashboard statistics"
        });
    }
};

module.exports = {
    getDashboardStats
};