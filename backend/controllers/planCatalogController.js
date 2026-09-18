const pool = require("../config/db");

const getPlanCatalog = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                catalog_id,
                plan_name,
                plan_amount,
                plan_duration,
                duration_type
             FROM membership_plan_catalog
             ORDER BY catalog_id`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching plan catalog:", error);

        res.status(500).json({
            message: "Error fetching membership plan catalog"
        });
    }
};

module.exports = {
    getPlanCatalog
};