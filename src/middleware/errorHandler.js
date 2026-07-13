const { AppError, ValidationError } = require("../utils/errors");

/**
 * Global error handler — catches all errors thrown in routes/services.
 * Returns a consistent JSON structure for every error.
 */
const errorHandler = (err, _req, res, _next) => {
  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err.message);
    if (!err.isOperational) console.error(err.stack);
  }

  // Prisma: unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  // Validation errors (our custom class)
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unexpected errors
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = errorHandler;
