const pool = require("../config/db");

const validateCategory = ({ category_name }) => {
    if (!category_name || !category_name.trim()) {
        return "Category name is required";
    }

    return null;
};

const getCategories = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                category_id,
                category_name
             FROM exercise_category
             ORDER BY category_id`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching categories:", error);

        res.status(500).json({
            message: "Error fetching categories"
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;

        const validationError = validateCategory(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `INSERT INTO exercise_category (category_name)
             VALUES ($1)
             RETURNING category_id, category_name`,
            [category_name.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating category:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A category with this name already exists"
            });
        }

        res.status(500).json({
            message: "Error creating category"
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        const validationError = validateCategory(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `UPDATE exercise_category
             SET category_name = $1
             WHERE category_id = $2
             RETURNING category_id, category_name`,
            [category_name.trim(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating category:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A category with this name already exists"
            });
        }

        res.status(500).json({
            message: "Error updating category"
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        const result = await pool.query(
            `DELETE FROM exercise_category
             WHERE category_id = $1
             RETURNING category_id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting category:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete this category because exercises are using it"
            });
        }

        res.status(500).json({
            message: "Error deleting category"
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};