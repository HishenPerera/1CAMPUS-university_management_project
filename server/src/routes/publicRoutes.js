const express = require("express");
const router = express.Router();
const { submitApplication } = require("../controllers/publicController");

// Public route entirely unprotected
router.post("/apply", submitApplication);

module.exports = router;
