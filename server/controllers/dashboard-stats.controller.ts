import { Response } from "express";
import User from "../models/Users";
import Scholarship from "../models/Scholarship";
import ScholarshipApplication from "../models/ScholarshipApplication";
import { ok, forbidden, serverError } from "../utils/responses";

interface AuthenticatedRequest {
  user?: { id: string; email: string };
  query: any;
  body: any;
}

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const [
      totalUsers,
      activeStudents,
      activeSponsors,
      totalStudents,
      totalSponsors,
      totalScholarships,
      activeScholarships,
      closedScholarships,
      suspendedScholarships,
      archivedScholarships,
      totalApplications,
      approvedApplications,
      deniedApplications,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "student", status: "active" } }),
      User.count({ where: { role: "sponsor", status: "active" } }),
      User.count({ where: { role: "student" } }),
      User.count({ where: { role: "sponsor" } }),
      Scholarship.count(),
      Scholarship.count({ where: { status: "active" } }),
      Scholarship.count({ where: { status: "closed" } }),
      Scholarship.count({ where: { status: "suspended" } }),
      Scholarship.count({ where: { status: "archived" } }),
      ScholarshipApplication.count(),
      ScholarshipApplication.count({ where: { status: "approved" } }),
      ScholarshipApplication.count({ where: { status: "denied" } }),
    ]);

    return ok(res, "Dashboard stats fetched successfully", {
      stats: {
        totalUsers,
        activeStudents,
        activeSponsors,
        totalStudents,
        totalSponsors,
        totalScholarships,
        activeScholarships,
        closedScholarships,
        suspendedScholarships,
        archivedScholarships,
        totalApplications,
        approvedApplications,
        deniedApplications,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return serverError(res);
  }
};
