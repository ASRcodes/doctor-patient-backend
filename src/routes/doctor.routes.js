const { Router } = require("express");
const doctorController = require("../controllers/doctor.controller");
const { authenticate } = require("../middleware/auth");

const router = Router();

router.get("/", authenticate, doctorController.getAllDoctors);
router.get("/:id", authenticate, doctorController.getDoctorById);

module.exports = router;
