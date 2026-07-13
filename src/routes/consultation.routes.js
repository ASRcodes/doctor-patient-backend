const { Router } = require("express");
const consultationController = require("../controllers/consultation.controller");
const messageController = require("../controllers/message.controller");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

// Consultation CRUD
router.post("/", authenticate, authorize("PATIENT"), consultationController.createConsultation);
router.get("/", authenticate, consultationController.getConsultations);
router.get("/:id", authenticate, consultationController.getConsultationById);
router.patch("/:id/status", authenticate, authorize("DOCTOR"), consultationController.updateStatus);

// Messages (nested under consultation)
router.post("/:id/messages", authenticate, messageController.sendMessage);
router.get("/:id/messages", authenticate, messageController.getMessages);

module.exports = router;
