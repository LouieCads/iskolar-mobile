import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { scheduleCloseExpiredScholarships } from "./jobs/closeExpiredScholarships";
import sequelize from "./config/database";
import authRoutes from "./routes/auth.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import profileRoutes from "./routes/profile.routes";
import scholarshipRoutes from "./routes/scholarship-creation.routes";
import scholarshipApplicationRoutes from './routes/scholarship-application.routes';
import userManagementRoutes from './routes/user-management.routes';
import { seedAdmin } from './scripts/seed-admin';

// Import Models
import User from "./models/Users";
import Student from "./models/Student";
import Sponsor from "./models/Sponsor";
import Scholarship from "./models/Scholarship";
import ScholarshipApplication from "./models/ScholarshipApplication";
import SelectedScholar from "./models/SelectedScholar";
import StatusLog from "./models/StatusLog";
import "./models/PasswordResetToken";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile clients, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: false,
  })
);

// Initialize model associations
const models = {
  User,
  Student,
  Sponsor,
  Scholarship,
  ScholarshipApplication,
  SelectedScholar,
  StatusLog
};

// Call associate method for each model
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/profile", profileRoutes);
app.use("/scholarship", scholarshipRoutes);
app.use('/scholarship-application', scholarshipApplicationRoutes);
app.use('/admin/users', userManagementRoutes);

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL connected");
    if (process.env.NODE_ENV === "development") {
      return sequelize.sync({ alter: true }).then(() => {});
    }
  })
  .then(async () => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Database & tables synced (development only)");
    }
    await seedAdmin();
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  scheduleCloseExpiredScholarships();
});