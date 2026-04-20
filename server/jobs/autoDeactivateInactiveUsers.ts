import cron from "node-cron";
import { autoDeactivateInactiveUsers } from "../utils/auto-deactivate";

/**
 * Scheduled job: automatically deactivates users who haven't logged in for 90+ consecutive days.
 * Runs daily at 00:00 (midnight) UTC.
 */
export function scheduleAutoDeactivateInactiveUsers(): void {
  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await autoDeactivateInactiveUsers();
      if (result.count > 0) {
        console.log(
          `[autoDeactivateInactiveUsers] Deactivated ${result.count} inactive user(s): ${result.users.join(", ")}`
        );
      } else {
        console.log(
          `[autoDeactivateInactiveUsers] No inactive users found for deactivation`
        );
      }
    } catch (error) {
      console.error("[autoDeactivateInactiveUsers] Failed to run job:", error);
    }
  });

  console.log("[autoDeactivateInactiveUsers] Scheduled (runs daily at 00:00 UTC).");
}
