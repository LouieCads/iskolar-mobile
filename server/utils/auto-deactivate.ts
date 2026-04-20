import User from "../models/Users";
import { Op } from "sequelize";

/**
 * Automatically deactivates users who haven't been active for 90+ consecutive days
 * Activity is tracked by last_login timestamp
 * Users who never logged in are not affected (assumed new accounts)
 */
export async function autoDeactivateInactiveUsers(): Promise<{ count: number; users: string[] }> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find active users whose last_login is older than 90 days
    const inactiveUsers = await User.findAll({
      where: {
        status: "active",
        last_login: {
          [Op.lt]: ninetyDaysAgo,
        },
      },
      attributes: ["user_id", "email", "last_login"],
    });

    if (inactiveUsers.length === 0) {
      console.log(`[Auto-Deactivate] No inactive users found for deactivation`);
      return { count: 0, users: [] };
    }

    // Deactivate these users
    const deactivatedEmails: string[] = [];
    for (const user of inactiveUsers) {
      user.status = "deactivated";
      await user.save();
      deactivatedEmails.push((user as any).email);
    }

    console.log(
      `[Auto-Deactivate] Deactivated ${deactivatedEmails.length} inactive users: ${deactivatedEmails.join(", ")}`
    );

    return { count: deactivatedEmails.length, users: deactivatedEmails };
  } catch (error) {
    console.error("[Auto-Deactivate] Error deactivating inactive users:", error);
    return { count: 0, users: [] };
  }
}
