const authService = require("../services/auth.service");
const { validateRegister, validateLogin } = require("../validators");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendCreated } = require("../utils/response");

const register = asyncHandler(async (req, res) => {
  validateRegister(req.body);
  const result = await authService.register(req.body);
  sendCreated(res, { message: "Registration successful", data: result });
});

const login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const result = await authService.login(req.body);
  sendSuccess(res, { message: "Login successful", data: result });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  sendSuccess(res, { data: profile });
});

module.exports = { register, login, getProfile };
