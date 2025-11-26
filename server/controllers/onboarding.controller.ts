import { Request, Response } from "express";
import User from "../models/Users";
import Student from "../models/Student";
import Sponsor from "../models/Sponsor";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Role Selection
export const selectRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    if (!role || !['student', 'sponsor'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role. Must be 'student' or 'sponsor'" 
      });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (user.role && user.has_selected_role) {
      return res.status(400).json({ 
        success: false,
        message: `You have already selected your role as ${user.role}.`,
        currentRole: user.role,
        hasSelectedRole: user.has_selected_role
      });
    }

    user.role = role;
    user.has_selected_role = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role selected successfully",
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        has_selected_role: user.has_selected_role
      }
    });
  } catch (error) {
    console.error("Error selecting role:", error);
    return res.status(500).json({
      success: false,
      message: "Error selecting role. Please try again later."
    });
  }
};

// Student Profile Setup
export const setupStudentProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, gender, date_of_birth, contact_number } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    if (!full_name || !gender || !date_of_birth || !contact_number) {
      return res.status(400).json({ 
        success: false,
        message: "All required fields must be provided." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: "You must have student role to create student profile." 
      });
    }

    let student = await Student.findOne({ where: { user_id: userId } });
    
    if (student && student.has_completed_profile) {
      return res.status(400).json({ 
        success: false,
        message: "Your profile already exists and is completed." 
      });
    }

    const normalizedGender = gender.toLowerCase();
    
    if (normalizedGender && !['male', 'female'].includes(normalizedGender)) {
      return res.status(400).json({ 
        success: false,
        message: "Gender must be either 'male' or 'female'." 
      });
    }

    if (student) {
      await student.update({
        full_name,
        gender: normalizedGender as 'male' | 'female' | undefined,
        date_of_birth,
        contact_number,
        has_completed_profile: true
      });
    } else {
      student = await Student.create({
        user_id: userId,
        full_name,
        gender: normalizedGender as 'male' | 'female' | undefined,
        date_of_birth,
        contact_number,
        has_completed_profile: true
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile created successfully!",
      student: {
        id: student.student_id,
        full_name: student.full_name,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        contact_number: student.contact_number
      }
    });
  } catch (error) {
    console.error("Error setting up student profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up student profile. Please try again later."
    });
  }
};

// Sponsor Profile Setup
export const setupSponsorProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organization_name, organization_type, contact_number } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    if (!organization_name || !organization_type  || !contact_number) {
      return res.status(400).json({ 
        success: false,
        message: "All required fields must be provided." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    if (user.role !== 'sponsor') {
      return res.status(403).json({ 
        success: false,
        message: "User must have sponsor role to create sponsor profile." 
      });
    }

    let sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    
    if (sponsor && sponsor.has_completed_profile) {
      return res.status(400).json({ 
        success: false,
        message: "Sponsor profile already exists and is completed." 
      });
    }

    const normalizedOrgType = organization_type.toLowerCase().replace(/\s+/g, '_');
    
    const validOrgTypes = ['non_profit', 'private_company', 'government_agency', 'educational_institution', 'foundation'];
    if (normalizedOrgType && !validOrgTypes.includes(normalizedOrgType)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid organization type." 
      });
    }

    if (sponsor) {
      await sponsor.update({
        organization_name,
        organization_type: normalizedOrgType as any,
        contact_number,
        has_completed_profile: true
      });
    } else {
      sponsor = await Sponsor.create({
        user_id: userId,
        organization_name,
        organization_type: normalizedOrgType as any,
        contact_number,
        has_completed_profile: true
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sponsor profile created successfully!",
      sponsor: {
        id: sponsor.sponsor_id,
        organization_name: sponsor.organization_name,
        organization_type: sponsor.organization_type,
        contact_number: sponsor.contact_number
      }
    });
  } catch (error) {
    console.error("Error setting up sponsor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up sponsor profile. Please try again later."
    });
  }
};

// User Profile Status
export const getProfileStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    let profileCompleted = false;
    
    if (user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: userId } });
      profileCompleted = student?.has_completed_profile || false;
    } else if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
      profileCompleted = sponsor?.has_completed_profile || false;
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        has_selected_role: user.has_selected_role,
        profile_completed: profileCompleted
      }
    });
  } catch (error) {
    console.error("Error getting profile status:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting profile status. Please try again later."
    });
  }
};

