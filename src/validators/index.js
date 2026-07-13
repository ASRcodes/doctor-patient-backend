const { ValidationError } = require("../utils/errors");

/**
 * Lightweight validation helpers — no external library needed.
 * Each validator returns an array of error strings.
 */

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isNonEmptyString = (val) => typeof val === "string" && val.trim().length > 0;

const isValidUUID = (val) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// ---------- Auth Validators ----------

const validateRegister = (body) => {
  const errors = [];

  if (!isNonEmptyString(body.name)) {
    errors.push("Name is required");
  }

  if (!isNonEmptyString(body.email)) {
    errors.push("Email is required");
  } else if (!isValidEmail(body.email)) {
    errors.push("Invalid email format");
  }

  if (!isNonEmptyString(body.password)) {
    errors.push("Password is required");
  } else if (body.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (!body.role || !["PATIENT", "DOCTOR"].includes(body.role.toUpperCase())) {
    errors.push("Role must be PATIENT or DOCTOR");
  }

  // Doctor-specific fields
  if (body.role && body.role.toUpperCase() === "DOCTOR") {
    if (!isNonEmptyString(body.specialization)) {
      errors.push("Specialization is required for doctors");
    }
    if (body.yearsOfExperience === undefined || body.yearsOfExperience === null) {
      errors.push("Years of experience is required for doctors");
    } else if (!Number.isInteger(body.yearsOfExperience) || body.yearsOfExperience < 0) {
      errors.push("Years of experience must be a non-negative integer");
    }
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

const validateLogin = (body) => {
  const errors = [];

  if (!isNonEmptyString(body.email)) {
    errors.push("Email is required");
  } else if (!isValidEmail(body.email)) {
    errors.push("Invalid email format");
  }

  if (!isNonEmptyString(body.password)) {
    errors.push("Password is required");
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

// ---------- Consultation Validators ----------

const validateCreateConsultation = (body) => {
  const errors = [];

  if (!isNonEmptyString(body.doctorId)) {
    errors.push("Doctor ID is required");
  } else if (!isValidUUID(body.doctorId)) {
    errors.push("Invalid doctor ID format");
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

const validateStatusUpdate = (body) => {
  const errors = [];
  const validStatuses = ["ACTIVE", "COMPLETED"];

  if (!body.status || !validStatuses.includes(body.status.toUpperCase())) {
    errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

// ---------- Message Validators ----------

const validateMessage = (body) => {
  const errors = [];

  if (!isNonEmptyString(body.content)) {
    errors.push("Message content is required");
  } else if (body.content.trim().length > 2000) {
    errors.push("Message content cannot exceed 2000 characters");
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

// ---------- Shared ----------

const validateUUID = (id, label = "ID") => {
  if (!isValidUUID(id)) {
    throw new ValidationError([`Invalid ${label} format`]);
  }
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateConsultation,
  validateStatusUpdate,
  validateMessage,
  validateUUID,
};
