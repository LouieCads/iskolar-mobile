import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import User from "../models/Users";
import Student from "../models/Student";
import Sponsor from "../models/Sponsor";
import { containerClient } from "../config/azure";
import { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Generate SAS URL
const generateSasUrl = (blobName: string): string => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_CONTAINER_NAME;
    
    if (!connectionString || !containerName) {
      console.error('Missing Azure credentials:', {
        hasConnectionString: !!connectionString,
        hasContainerName: !!containerName
      });
      throw new Error('Azure Storage credentials not configured properly');
    }
    
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
    
    if (!accountNameMatch || !accountKeyMatch) {
      throw new Error('Invalid Azure Storage connection string format');
    }
    
    const accountName = accountNameMatch[1];
    const accountKey = accountKeyMatch[1];
    
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    const sasOptions = {
      containerName: containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse("r"), 
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;

    return sasUrl;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    throw error;
  }
};

// Get user profile details
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
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

    let profileData: any = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      profile_url: user.profile_url,
      has_selected_role: user.has_selected_role,
    };

    if (user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: userId } });
      if (student) {
        profileData = {
          ...profileData,
          full_name: student.full_name,
          gender: student.gender,
          date_of_birth: student.date_of_birth,
          contact_number: student.contact_number,
          has_completed_profile: student.has_completed_profile,
        };
      }
    } else if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
      if (sponsor) {
        profileData = {
          ...profileData,
          sponsor_id: sponsor.sponsor_id,
          organization_name: sponsor.organization_name,
          organization_type: sponsor.organization_type,
          contact_number: sponsor.contact_number,
          has_completed_profile: sponsor.has_completed_profile,
        };
      }
    }

    return res.status(200).json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting profile. Please try again later."
    });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No image file provided." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    if (user.profile_url) {
      try {
        const urlWithoutSas = user.profile_url.split('?')[0];
        const urlParts = urlWithoutSas.split('/');
        const oldBlobName = urlParts.slice(-2).join('/');
        const oldBlockBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        await oldBlockBlobClient.deleteIfExists();
      } catch (deleteError) {
        console.warn("Failed to delete old profile picture:", deleteError);
      }
    }

    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `profile-${userId}-${uuidv4()}.${fileExtension}`;
    const blobName = `profiles/${fileName}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype,
      },
    });

    const blobUrl = generateSasUrl(blobName);

    user.profile_url = blobUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      profile_url: blobUrl
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      : "Error uploading profile picture. Please try again later.";
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req: AuthenticatedRequest, res: Response) => {
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

    if (!user.profile_url) {
      return res.status(400).json({ 
        success: false,
        message: "No profile picture to delete." 
      });
    }

    const urlWithoutSas = user.profile_url.split('?')[0]; // Remove SAS token
    const urlParts = urlWithoutSas.split('/');
    const blobName = urlParts.slice(-2).join('/'); 

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (blobError) {
      console.warn("Failed to delete blob from Azure:", blobError);
    }

    user.profile_url = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting profile picture. Please try again later."
    });
  }
};

// Update profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
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

    if (user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: userId } });
      if (!student) {
        return res.status(404).json({ 
          success: false,
          message: "Student profile not found." 
        });
      }

      const { full_name, gender, date_of_birth, contact_number } = req.body;

      if (full_name) student.full_name = full_name;
      if (gender) student.gender = gender;
      if (date_of_birth) student.date_of_birth = date_of_birth;
      if (contact_number) student.contact_number = contact_number;

      await student.save();

      return res.status(200).json({
        success: true,
        message: "Student profile updated successfully",
        student: {
          full_name: student.full_name,
          gender: student.gender,
          date_of_birth: student.date_of_birth,
          contact_number: student.contact_number,
        }
      });
    } else if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
      if (!sponsor) {
        return res.status(404).json({ 
          success: false,
          message: "Sponsor profile not found." 
        });
      }

      const { organization_name, organization_type, contact_number } = req.body;

      if (organization_name) sponsor.organization_name = organization_name;
      if (organization_type) sponsor.organization_type = organization_type;
      if (contact_number) sponsor.contact_number = contact_number;

      await sponsor.save();

      return res.status(200).json({
        success: true,
        message: "Sponsor profile updated successfully",
        sponsor: {
          organization_name: sponsor.organization_name,
          organization_type: sponsor.organization_type,
          contact_number: sponsor.contact_number,
        }
      });
    }

    return res.status(400).json({ 
      success: false,
      message: "Invalid user role." 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile. Please try again later."
    });
  }
};

export { upload };
