const { Router } = require("express");
const authRoutes = require("./auth.routes");
const doctorRoutes = require("./doctor.routes");
const consultationRoutes = require("./consultation.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/consultations", consultationRoutes);

module.exports = router;
