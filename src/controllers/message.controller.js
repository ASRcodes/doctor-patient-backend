const messageService = require("../services/message.service");
const { validateMessage, validateUUID } = require("../validators");
const asyncHandler = require("../utils/asyncHandler");
const { sendCreated, sendPaginated } = require("../utils/response");
const config = require("../config");

const sendMessage = asyncHandler(async (req, res) => {
  validateUUID(req.params.id, "Consultation ID");
  validateMessage(req.body);

  const message = await messageService.sendMessage(
    req.params.id,
    req.user.id,
    req.body.content
  );

  sendCreated(res, { message: "Message sent", data: message });
});

const getMessages = asyncHandler(async (req, res) => {
  validateUUID(req.params.id, "Consultation ID");

  const page = Math.max(1, parseInt(req.query.page, 10) || config.pagination.defaultPage);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit, 10) || config.pagination.defaultLimit)
  );

  const { messages, total } = await messageService.getMessages(
    req.params.id,
    req.user.id,
    { page, limit }
  );

  sendPaginated(res, { data: messages, page, limit, total });
});

module.exports = { sendMessage, getMessages };
