require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const dashboardRoutes = require("./routes/dashboardRoutes");
const memberRoutes = require("./routes/memberRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const progressRoutes = require("./routes/progressRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const planCatalogRoutes = require("./routes/planCatalogRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Gym Management System Backend is running!");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/plan-catalog", planCatalogRoutes);
app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});