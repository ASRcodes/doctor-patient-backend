/**
 * Standardized API response format.
 * Every response follows: { success, message, data }
 */
const sendSuccess = (res, { statusCode = 200, message = "Success", data = null }) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, { message = "Created successfully", data = null }) => {
  return sendSuccess(res, { statusCode: 201, message, data });
};

const sendPaginated = (res, { message = "Success", data, page, limit, total }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendCreated, sendPaginated };
