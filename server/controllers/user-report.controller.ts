import { Response } from "express";
import { Op } from "sequelize";
import User from "../models/Users";
import Student from "../models/Student";
import Sponsor from "../models/Sponsor";
import ScholarshipApplication from "../models/ScholarshipApplication";
import Scholarship from "../models/Scholarship";
import { ok, badRequest, forbidden, serverError } from "../utils/responses";

interface AuthenticatedRequest {
  user?: { id: string; email: string };
  query: any;
  body: any;
}

function activityLevel(count: number): string {
  if (count >= 3) return "High";
  if (count >= 1) return "Medium";
  return "Low";
}

export const getUserReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const { role, status, from_date, to_date, activity_level } =
      req.query as Record<string, string>;

    const where: any = {};

    if (role && ["student", "sponsor", "admin"].includes(role.toLowerCase())) {
      where.role = role.toLowerCase();
    }
    if (status && ["active", "suspended", "deactivated"].includes(status.toLowerCase())) {
      where.status = status.toLowerCase();
    }
    if (from_date) {
      const d = new Date(from_date);
      if (isNaN(d.getTime())) return badRequest(res, "Invalid from_date");
      where.created_at = { ...where.created_at, [Op.gte]: d };
    }
    if (to_date) {
      const end = new Date(to_date);
      if (isNaN(end.getTime())) return badRequest(res, "Invalid to_date");
      end.setUTCHours(23, 59, 59, 999);
      where.created_at = { ...where.created_at, [Op.lte]: end };
    }

    const users = await User.findAll({
      where,
      attributes: ["user_id", "email", "role", "status", "created_at"],
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["full_name", "has_completed_profile"],
          required: false,
          include: [
            {
              model: ScholarshipApplication,
              as: "scholarship_applications",
              attributes: ["scholarship_application_id"],
              required: false,
            },
          ],
        },
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["organization_name", "has_completed_profile"],
          required: false,
          include: [
            {
              model: Scholarship,
              as: "scholarships",
              attributes: ["scholarship_id"],
              required: false,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    let mapped = users.map((u: any) => {
      const name =
        u.student?.full_name || u.sponsor?.organization_name || u.email.split("@")[0];

      let profileCompletion = "N/A";
      if (u.student) profileCompletion = u.student.has_completed_profile ? "Complete" : "Incomplete";
      else if (u.sponsor) profileCompletion = u.sponsor.has_completed_profile ? "Complete" : "Incomplete";

      let actCount = 0;
      if (u.student) actCount = u.student.scholarship_applications?.length ?? 0;
      else if (u.sponsor) actCount = u.sponsor.scholarships?.length ?? 0;

      return {
        user_id: u.user_id,
        name,
        email: u.email,
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Unknown",
        status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active",
        profile_completion: profileCompletion,
        activity_level: activityLevel(actCount),
        activity_count: actCount,
        registration_date: u.created_at,
      };
    });

    if (activity_level && ["high", "medium", "low"].includes(activity_level.toLowerCase())) {
      mapped = mapped.filter(
        (u) => u.activity_level.toLowerCase() === activity_level.toLowerCase()
      );
    }

    const total = mapped.length;
    const byRole = mapped.reduce((acc: Record<string, number>, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    const byStatus = mapped.reduce((acc: Record<string, number>, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      return acc;
    }, {});
    const byActivity = mapped.reduce((acc: Record<string, number>, u) => {
      acc[u.activity_level] = (acc[u.activity_level] || 0) + 1;
      return acc;
    }, {});

    return ok(res, "User report generated successfully", {
      report: {
        title: "User Report",
        generated_at: new Date().toISOString(),
        filters: {
          role: role || "All",
          status: status || "All",
          from_date: from_date || null,
          to_date: to_date || null,
          activity_level: activity_level || "All",
        },
        summary: { total, byRole, byStatus, byActivity },
        data: mapped,
      },
    });
  } catch (err) {
    console.error("getUserReport error:", err);
    return serverError(res);
  }
};
