const consultationService = require("../services/consultation.service");
const {
  validateCreateConsultation,
  validateStatusUpdate,
  validateUUID,
} = require("../validators");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated, sendPaginated } = require("../utils/response");
const config = require("../config");

const createConsultation = asyncHandler(async (req, res) => {
  validateCreateConsultation(req.body);

  const consultation = await consultationService.createConsultation(
    req.user.id,
    req.body.doctorId
  );

  sendCreated(res, { message: "Consultation created", data: consultation });
});

const getConsultations = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || config.pagination.defaultPage);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit, 10) || config.pagination.defaultLimit)
  );

  const { consultations, total } = await consultationService.getConsultations(
    req.user,
    { page, limit }
  );

  sendPaginated(res, { data: consultations, page, limit, total });
});

const getConsultationById = asyncHandler(async (req, res) => {
  validateUUID(req.params.id, "Consultation ID");

  const consultation = await consultationService.getConsultationById(
    req.params.id,
    req.user
  );

  sendSuccess(res, { data: consultation });
});

const updateStatus = asyncHandler(async (req, res) => {
  validateUUID(req.params.id, "Consultation ID");
  validateStatusUpdate(req.body);

  const consultation = await consultationService.updateConsultationStatus(
    req.params.id,
    req.body.status.toUpperCase(),
    req.user
  );

  sendSuccess(res, { message: "Status updated", data: consultation });
});

module.exports = { createConsultation, getConsultations, getConsultationById, updateStatus };
