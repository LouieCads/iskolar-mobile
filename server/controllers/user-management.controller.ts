import { Response } from "express";
import { Op } from "sequelize";
import User from "../models/Users";
import Student from "../models/Student";
import Sponsor from "../models/Sponsor";
import { ok, badRequest, forbidden, serverError } from "../utils/responses";

interface AuthenticatedRequest {
  user?: { id: string; email: string };
  query: any;
}

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const {
      search,
      role,
      status,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (role && ["student", "sponsor", "admin"].includes(role.toLowerCase())) {
      where.role = role.toLowerCase();
    }

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ["user_id", "email", "role", "profile_url", "created_at"],
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["full_name"],
          required: false,
        },
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["organization_name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
    });

    // If searching by name, we need to also search student/sponsor names
    // Since Op.or across associations is tricky, we do a second pass if search is provided
    let finalUsers = users;
    let finalCount = count;

    if (search) {
      // Re-query with association search
      const { count: fullCount, rows: fullUsers } = await User.findAndCountAll({
        where: {
          [Op.and]: [
            ...(where.role ? [{ role: where.role }] : []),
            {
              [Op.or]: [
                { email: { [Op.iLike]: `%${search}%` } },
                { "$student.full_name$": { [Op.iLike]: `%${search}%` } },
                { "$sponsor.organization_name$": { [Op.iLike]: `%${search}%` } },
              ],
            },
          ],
        },
        attributes: ["user_id", "email", "role", "profile_url", "created_at"],
        include: [
          {
            model: Student,
            as: "student",
            attributes: ["full_name"],
            required: false,
          },
          {
            model: Sponsor,
            as: "sponsor",
            attributes: ["organization_name"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: limitNum,
        offset,
        subQuery: false,
      });

      finalUsers = fullUsers;
      finalCount = fullCount;
    }

    // Map to response shape
    const mapped = finalUsers.map((u: any) => {
      const name =
        u.student?.full_name ||
        u.sponsor?.organization_name ||
        u.email.split("@")[0];

      const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join("");

      return {
        user_id: u.user_id,
        name,
        email: u.email,
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Unknown",
        status: "Active", // TODO: add status field to User model when needed
        profile_url: u.profile_url,
        initials,
        registration_date: u.created_at,
      };
    });

    return ok(res, "Users retrieved successfully", {
      users: mapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: finalCount,
        totalPages: Math.ceil(finalCount / limitNum),
      },
    });
  } catch (err) {
    console.error("getUsers error:", err);
    return serverError(res);
  }
};

export const getUserById = async (req: AuthenticatedRequest & { params: any }, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.user!.id);
    if (!adminUser || adminUser.role !== "admin") {
      return forbidden(res, "Admin access required");
    }

    const { userId } = req.params;
    if (!userId) return badRequest(res, "User ID is required");

    const user = await User.findByPk(userId, {
      attributes: ["user_id", "email", "role", "profile_url", "has_selected_role", "created_at"],
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["full_name", "gender", "date_of_birth", "contact_number", "has_completed_profile"],
          required: false,
        },
        {
          model: Sponsor,
          as: "sponsor",
          attributes: ["organization_name", "organization_type", "contact_number", "has_completed_profile"],
          required: false,
        },
      ],
    });

    if (!user) return badRequest(res, "User not found");

    const u = user as any;
    const name =
      u.student?.full_name ||
      u.sponsor?.organization_name ||
      u.email.split("@")[0];

    return ok(res, "User retrieved successfully", {
      user: {
        user_id: u.user_id,
        name,
        email: u.email,
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Unknown",
        status: "Active",
        profile_url: u.profile_url,
        has_selected_role: u.has_selected_role,
        registration_date: u.created_at,
        student: u.student || null,
        sponsor: u.sponsor || null,
      },
    });
  } catch (err) {
    console.error("getUserById error:", err);
    return serverError(res);
  }
};
