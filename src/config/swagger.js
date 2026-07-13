const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Doctor-Patient Consultation API",
      version: "1.0.0",
      description:
        "Backend API for a healthcare consultation platform. Supports patient/doctor registration, browsing doctors, creating consultations, and exchanging chat messages.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API base path",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from /auth/login",
        },
      },
      schemas: {
        // ---- Auth ----
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", minLength: 6, example: "securepass123" },
            role: { type: "string", enum: ["PATIENT", "DOCTOR"], example: "PATIENT" },
            specialization: {
              type: "string",
              description: "Required if role is DOCTOR",
              example: "Cardiology",
            },
            yearsOfExperience: {
              type: "integer",
              description: "Required if role is DOCTOR",
              example: 5,
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "securepass123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: { type: "string" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["PATIENT", "DOCTOR"] },
            createdAt: { type: "string", format: "date-time" },
            doctorProfile: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                specialization: { type: "string" },
                yearsOfExperience: { type: "integer" },
              },
            },
          },
        },
        // ---- Doctor ----
        Doctor: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "Doctor profile ID" },
            userId: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string" },
            specialization: { type: "string" },
            yearsOfExperience: { type: "integer" },
          },
        },
        // ---- Consultation ----
        CreateConsultationRequest: {
          type: "object",
          required: ["doctorId"],
          properties: {
            doctorId: {
              type: "string",
              format: "uuid",
              description: "Doctor profile ID (not user ID)",
              example: "uuid-of-doctor-profile",
            },
          },
        },
        UpdateStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["ACTIVE", "COMPLETED"],
              example: "ACTIVE",
            },
          },
        },
        Consultation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["PENDING", "ACTIVE", "COMPLETED"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            patient: { type: "object" },
            doctor: { type: "object" },
          },
        },
        // ---- Message ----
        SendMessageRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", maxLength: 2000, example: "Hello, I have a question." },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            content: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            sender: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
        // ---- Common ----
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
