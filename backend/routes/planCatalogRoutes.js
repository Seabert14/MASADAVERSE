const express = require("express");

const {
    getPlanCatalog
} = require("../controllers/planCatalogController");

const router = express.Router();

router.get("/", getPlanCatalog);

module.exports = router;