import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import routes from "./routes.js";

dotenv.config();

const app = express();

/**
 * CORS
 * - Allows your Vercel frontend
 * - Allows Render health checks
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server & health checks
      if (!origin) return callback(null, true);

      // allow Vercel deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // block everything else
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true
  })
);

/**
 * Body parser
 */
app.use(express.json({ limit: "1mb" }));

/**
 * Rate limiting
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    standardHeaders: true,
    legacyHeaders: false
  })
);

/**
 * API routes
 */
app.use("/api", routes);

/**
 * Health check
 */
app.get("/", (_, res) => {
  res.status(200).send("API OK");
});

/**
 * Server start
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});