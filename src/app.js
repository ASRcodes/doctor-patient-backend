const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const config = require("./config");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const swaggerSpec = require("./config/swagger");
const setupSocket = require("./config/socket");

const app = express();
const server = http.createServer(app);

// ── Socket.io (bonus) ──
const io = setupSocket(server);
app.set("io", io); // accessible in controllers if needed

// ── Security & Parsing ──
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── Logging ──
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

// ── Swagger Docs (bonus) ──
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Doctor-Patient API Docs",
}));

// ── Health Check ──
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use("/api", routes);

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
server.listen(config.port, () => {
  console.log(`\n🚀 Server running on http://localhost:${config.port}`);
  console.log(`📚 API Docs: http://localhost:${config.port}/api-docs`);
  console.log(`❤️  Health: http://localhost:${config.port}/health\n`);
});

module.exports = app;
