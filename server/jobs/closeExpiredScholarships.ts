import cron from "node-cron";
import { Op } from "sequelize";
import Scholarship from "../models/Scholarship";

/**
 * Scheduled job: closes active scholarships whose application deadline has passed.
 * Runs every hour at minute 0 (e.g. 01:00, 02:00, ...).
 */
export function scheduleCloseExpiredScholarships(): void {
  cron.schedule("0 * * * *", async () => {
    try {
      const [updatedCount] = await Scholarship.update(
        { status: "closed" },
        {
          where: {
            status: "active",
            application_deadline: { [Op.lt]: new Date() },
          },
        }
      );

      if (updatedCount > 0) {
        console.log(
          `[closeExpiredScholarships] Closed ${updatedCount} expired scholarship(s).`
        );
      }
    } catch (error) {
      console.error("[closeExpiredScholarships] Failed to run job:", error);
    }
  });

  console.log("[closeExpiredScholarships] Scheduled (runs every hour).");
}
