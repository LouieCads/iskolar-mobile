import { Response } from "express";
import { Op } from "sequelize";
import User from "../models/Users";
import Scholarship from "../models/Scholarship";
import ScholarshipApplication from "../models/ScholarshipApplication";
import Sponsor from "../models/Sponsor";
import { ok, badRequest, forbidden, serverError } from "../utils/responses";

interface AuthenticatedRequest {
  user?: { id: string; email: string };
  query: any;
  body: any;
}

export const getScholarshipReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const { sponsor, status, from_date, to_date } = req.query as Record<string, string>;

    const where: any = {};
    const sponsorWhere: any = {};

    if (status && ["draft", "active", "closed", "suspended", "archived"].includes(status.toLowerCase())) {
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
    const sponsorTrimmed = sponsor?.trim();
    if (sponsorTrimmed) {
      sponsorWhere.organization_name = { [Op.iLike]: `%${sponsorTrimmed}%` };
    }

    const scholarships = await Scholarship.findAll({
      where,
      include: [
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["organization_name", "organization_type"],
          where: Object.keys(sponsorWhere).length > 0 ? sponsorWhere : undefined,
          required: Object.keys(sponsorWhere).length > 0,
        },
        {
          model: ScholarshipApplication,
          as: "scholarship_applications",
          attributes: ["scholarship_application_id", "status"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const capitalize = (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : "Unknown";
    const formatEnum = (str: string) =>
      str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown";

    const mapped = scholarships.map((s: any) => {
      const apps: any[] = s.scholarship_applications || [];
      const totalApplications = apps.length;
      const approved = apps.filter((a) => a.status === "approved").length;
      const denied = apps.filter((a) => a.status === "denied").length;
      const pending = apps.filter((a) => a.status === "pending").length;
      const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
      const approvalRate = totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0;
      const denialRate = totalApplications > 0 ? Math.round((denied / totalApplications) * 100) : 0;

      return {
        scholarship_id: s.scholarship_id,
        title: s.title,
        sponsor: s.sponsor?.organization_name || "Unknown",
        type: formatEnum(s.type),
        purpose: formatEnum(s.purpose),
        status: capitalize(s.status),
        total_amount: s.total_amount,
        total_slot: s.total_slot,
        application_deadline: s.application_deadline,
        created_at: s.created_at,
        total_applications: totalApplications,
        approved,
        denied,
        pending,
        shortlisted,
        approval_rate: approvalRate,
        denial_rate: denialRate,
      };
    });

    const total = mapped.length;
    const byStatus = mapped.reduce((acc: Record<string, number>, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    const byType = mapped.reduce((acc: Record<string, number>, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    const totalApplications = mapped.reduce((sum, s) => sum + s.total_applications, 0);
    const totalApproved = mapped.reduce((sum, s) => sum + s.approved, 0);
    const totalDenied = mapped.reduce((sum, s) => sum + s.denied, 0);
    const overallApprovalRate =
      totalApplications > 0 ? Math.round((totalApproved / totalApplications) * 100) : 0;
    const overallDenialRate =
      totalApplications > 0 ? Math.round((totalDenied / totalApplications) * 100) : 0;

    return ok(res, "Scholarship report generated successfully", {
      report: {
        title: "Scholarship Report",
        generated_at: new Date().toISOString(),
        filters: {
          sponsor: sponsor || "All",
          status: status || "All",
          from_date: from_date || null,
          to_date: to_date || null,
        },
        summary: {
          total,
          byStatus,
          byType,
          totalApplications,
          totalApproved,
          totalDenied,
          overallApprovalRate,
          overallDenialRate,
        },
        data: mapped,
      },
    });
  } catch (err) {
    console.error("getScholarshipReport error:", err);
    return serverError(res);
  }
};
