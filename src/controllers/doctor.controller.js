const doctorService = require("../services/doctor.service");
const { validateUUID } = require("../validators");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendPaginated } = require("../utils/response");
const config = require("../config");

const getAllDoctors = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || config.pagination.defaultPage);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit, 10) || config.pagination.defaultLimit)
  );

  const { doctors, total } = await doctorService.getAllDoctors({ page, limit });
  sendPaginated(res, { data: doctors, page, limit, total });
});

const getDoctorById = asyncHandler(async (req, res) => {
  validateUUID(req.params.id, "Doctor ID");
  const doctor = await doctorService.getDoctorById(req.params.id);
  sendSuccess(res, { data: doctor });
});

module.exports = { getAllDoctors, getDoctorById };
