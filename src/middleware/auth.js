const jwt = require("jsonwebtoken");
const config = require("../config");
const prisma = require("../config/database");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

/**
 * Verifies the JWT token from the Authorization header
 * and attaches the full user object to req.user.
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided. Use: Authorization: Bearer <token>");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorProfile: { select: { id: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new UnauthorizedError("Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Token has expired"));
    }
    next(error);
  }
};

/**
 * Restricts access to specific roles.
 * Must be used after authenticate middleware.
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access restricted to: ${roles.join(", ")}`)
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
