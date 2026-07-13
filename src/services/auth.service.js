const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const config = require("../config");
const { ConflictError, UnauthorizedError } = require("../utils/errors");

/**
 * Generates a JWT token for the given user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Fields to return when querying users (never expose password).
 */
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  doctorProfile: {
    select: {
      id: true,
      specialization: true,
      yearsOfExperience: true,
    },
  },
};

/**
 * Registers a new user. Creates a DoctorProfile if the role is DOCTOR.
 */
const register = async ({ name, email, password, role, specialization, yearsOfExperience }) => {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const normalizedRole = role.toUpperCase();

  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: normalizedRole,
  };

  // If registering as a doctor, create the profile in the same transaction
  if (normalizedRole === "DOCTOR") {
    userData.doctorProfile = {
      create: {
        specialization: specialization.trim(),
        yearsOfExperience,
      },
    };
  }

  const user = await prisma.user.create({
    data: userData,
    select: userSelect,
  });

  const token = generateToken(user);

  return { user, token };
};

/**
 * Authenticates a user by email and password.
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      doctorProfile: {
        select: {
          id: true,
          specialization: true,
          yearsOfExperience: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken(user);

  // Strip password from response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

/**
 * Fetches the full profile for the authenticated user.
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  return user;
};

module.exports = { register, login, getProfile };
