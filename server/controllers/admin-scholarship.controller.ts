import { Response } from "express";
import { Op } from "sequelize";
import User from "../models/Users";
import Sponsor from "../models/Sponsor";
import Scholarship from "../models/Scholarship";
import ScholarshipStatusLog from "../models/ScholarshipStatusLog";
import { ok, badRequest, forbidden, notFound, serverError } from "../utils/responses";

interface AuthenticatedRequest {
  user?: { id: string; email: string };
  query: any;
  body: any;
  params: any;
}

const VALID_STATUSES = ["active", "closed", "suspended", "archived"] as const;
type AdminScholarshipStatus = (typeof VALID_STATUSES)[number];

export const getAdminScholarships = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const {
      search,
      sponsor,
      status,
      deadline,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && [...VALID_STATUSES, "draft"].includes(status.toLowerCase())) {
      where.status = status.toLowerCase();
    }

    if (deadline === "passed") {
      where.application_deadline = { [Op.lt]: new Date() };
    } else if (deadline === "upcoming") {
      where.application_deadline = { [Op.gte]: new Date() };
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const sponsorWhere: any = {};
    if (sponsor) {
      sponsorWhere.organization_name = { [Op.iLike]: `%${sponsor}%` };
    }

    const { count, rows: scholarships } = await Scholarship.findAndCountAll({
      where,
      include: [
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["sponsor_id", "organization_name"],
          where: Object.keys(sponsorWhere).length > 0 ? sponsorWhere : undefined,
          required: Object.keys(sponsorWhere).length > 0,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      subQuery: false,
    });

    const mapped = (scholarships as any[]).map((s) => ({
      scholarship_id: s.scholarship_id,
      title: s.title,
      sponsor_name: s.sponsor?.organization_name ?? "—",
      type: s.type,
      purpose: s.purpose,
      total_amount: s.total_amount,
      total_slot: s.total_slot,
      application_deadline: s.application_deadline,
      status: s.status,
      created_at: s.created_at,
    }));

    return ok(res, "Scholarships retrieved successfully", {
      scholarships: mapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error("getAdminScholarships error:", err);
    return serverError(res);
  }
};

export const getAdminScholarshipById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const { scholarshipId } = req.params;
    if (!scholarshipId) return badRequest(res, "Scholarship ID is required");

    const scholarship = await Scholarship.findByPk(scholarshipId, {
      include: [
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["sponsor_id", "organization_name", "organization_type", "contact_number"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email"],
            },
          ] as any,
        },
      ],
    });

    if (!scholarship) return notFound(res, "Scholarship not found");

    const s = scholarship as any;

    return ok(res, "Scholarship retrieved successfully", {
      scholarship: {
        scholarship_id: s.scholarship_id,
        title: s.title,
        description: s.description,
        sponsor_id: s.sponsor_id,
        sponsor_name: s.sponsor?.organization_name ?? "—",
        sponsor_type: s.sponsor?.organization_type ?? null,
        sponsor_contact: s.sponsor?.contact_number ?? null,
        sponsor_email: s.sponsor?.user?.email ?? null,
        type: s.type,
        purpose: s.purpose,
        total_amount: s.total_amount,
        total_slot: s.total_slot,
        application_deadline: s.application_deadline,
        criteria: s.criteria,
        required_documents: s.required_documents,
        status: s.status,
        image_url: s.image_url,
        created_at: s.created_at,
        updated_at: s.updated_at,
      },
    });
  } catch (err) {
    console.error("getAdminScholarshipById error:", err);
    return serverError(res);
  }
};

export const updateScholarshipStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const { scholarshipId } = req.params;
    if (!scholarshipId) return badRequest(res, "Scholarship ID is required");

    const { status } = req.body as { status?: string };
    if (!status || !VALID_STATUSES.includes(status.toLowerCase() as AdminScholarshipStatus)) {
      return badRequest(res, "Invalid status. Must be one of: active, closed, suspended, archived");
    }

    const newStatus = status.toLowerCase() as AdminScholarshipStatus;

    const scholarship = await Scholarship.findByPk(scholarshipId);
    if (!scholarship) return notFound(res, "Scholarship not found");

    const previousStatus = scholarship.status ?? "active";
    if (previousStatus === newStatus) {
      return badRequest(res, `Scholarship is already ${newStatus}`);
    }

    scholarship.status = newStatus;
    await scholarship.save();

    await ScholarshipStatusLog.create({
      scholarship_id: scholarship.scholarship_id,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: req.user!.id,
    });

    const displayStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    return ok(res, `Scholarship status updated to ${displayStatus}`, {
      scholarship_id: scholarship.scholarship_id,
      status: displayStatus,
    });
  } catch (err) {
    console.error("updateScholarshipStatus error:", err);
    return serverError(res);
  }
};
