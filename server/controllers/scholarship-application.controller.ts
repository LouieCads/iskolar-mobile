import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import ScholarshipApplication from "../models/ScholarshipApplication";
import Scholarship from "../models/Scholarship";
import Student from "../models/Student";
import Sponsor from "../models/Sponsor";
import User from "../models/Users";
import SelectedScholar from "../models/SelectedScholar";
import { containerClient } from "../config/azure";
import { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

/**
 * Generate SAS URL for uploaded files
 */
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

/**
 * Submit a scholarship application
 */
export const submitApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scholarship_id, custom_form_response } = req.body;
    const user_id = req.user?.id; 

    if (!scholarship_id || !custom_form_response) {
      res.status(400).json({
        success: false,
        message: "Scholarship ID and custom form response are required",
      });
      return;
    }

    if (!Array.isArray(custom_form_response)) {
      res.status(400).json({
        success: false,
        message: "Form response must be an array",
      });
      return;
    }

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
      return;
    }

    // Get the student record from the user_id
    const student = await Student.findOne({
      where: { user_id: user_id }
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student profile not found. Please complete your profile first.",
      });
      return;
    }

    const student_id = student.student_id;

    // Check if scholarship exists and is active
    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship) {
      res.status(404).json({
        success: false,
        message: "Scholarship not found",
      });
      return;
    }

    if (scholarship.status !== 'active') {
      res.status(400).json({
        success: false,
        message: "This scholarship is not accepting applications",
      });
      return;
    }

    // Check if application deadline has passed
    if (scholarship.application_deadline && new Date(scholarship.application_deadline) < new Date()) {
      res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
      return;
    }

    // Check if student has already applied
    const existingApplication = await ScholarshipApplication.findOne({
      where: {
        student_id, 
        scholarship_id,
      },
    });

    if (existingApplication) {
      // Allow re-apply only if the previous application was denied.
      if (existingApplication.status === 'denied') {
        await existingApplication.update({
          custom_form_response,
          status: 'pending',
          remarks: null as any,
          applied_at: new Date(),
        });

        res.status(200).json({
          success: true,
          message: "Re-application submitted successfully",
          application: {
            scholarship_application_id: existingApplication.scholarship_application_id,
            student_id: existingApplication.student_id,
            scholarship_id: existingApplication.scholarship_id,
            status: 'pending',
            custom_form_response: existingApplication.custom_form_response,
            applied_at: existingApplication.applied_at,
            updated_at: existingApplication.updated_at,
            remarks: existingApplication.remarks,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "You have already applied to this scholarship",
      });
      return;
    }

    // Create the application 
    const application = await ScholarshipApplication.create({
      student_id, 
      scholarship_id,
      custom_form_response,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        scholarship_application_id: application.scholarship_application_id,
        student_id: application.student_id,
        scholarship_id: application.scholarship_id,
        status: application.status,
        custom_form_response: application.custom_form_response,
        applied_at: application.applied_at,
        updated_at: application.updated_at,
        remarks: application.remarks,
      },
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit application",
    });
  }
};

/**
 * Upload files for a custom form field
 */
export const uploadApplicationFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { application_id } = req.params;
    const { field_key } = req.body;
    const files = req.files as Express.Multer.File[];
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!field_key) {
      res.status(400).json({
        success: false,
        message: "Field key is required",
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No files provided",
      });
      return;
    }

    const student = await Student.findOne({
      where: { user_id: user_id }
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
      return;
    }

    const application = await ScholarshipApplication.findByPk(application_id);
    if (!application) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    if (application.student_id !== student.student_id) {
      res.status(403).json({
        success: false,
        message: "Unauthorized to upload files for this application",
      });
      return;
    }

    const fileUrls: string[] = [];

    for (const file of files) {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const blobName = `application/${application_id}/${field_key}/${fileName}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { 
          blobContentType: file.mimetype 
        },
      });

      const sasUrl = generateSasUrl(blobName);
      fileUrls.push(sasUrl);
    }

    // Update the specific field in the array
    const currentResponse = application.custom_form_response as Array<{ label: string; value: any }>;
    const updatedResponse = currentResponse.map(item => {
      if (item.label === field_key) {
        return { ...item, value: fileUrls };
      }
      return item;
    });

    await application.update({
      custom_form_response: updatedResponse,
    });

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      file_urls: fileUrls,
    });
  } catch (error) {
    console.error("Upload files error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload files",
    });
  }
};

/**
 * Get all applications for the current student
 */
export const getMyApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
      return;
    }

    const student = await Student.findOne({
      where: { user_id: user_id }
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
      return;
    }

    const applications = await ScholarshipApplication.findAll({
      where: { student_id: student.student_id },
      include: [
        {
          model: Scholarship,
          as: "scholarship",
          include: [
            {
              model: Sponsor,
              as: "sponsor",
              attributes: ['sponsor_id', 'organization_name', 'user_id'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['profile_url']
                }
              ]
            },
          ],
        },
      ],
      order: [["applied_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch applications",
    });
  }
};

/**
 * Get a specific application by ID
 */
export const getApplicationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { application_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const student = await Student.findOne({
      where: { user_id: user_id }
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
      return;
    }

    const application = await ScholarshipApplication.findByPk(application_id, {
      include: [
        {
          model: Scholarship,
          as: "scholarship",
          include: [
            {
              model: Sponsor,
              as: "sponsor",
              attributes: ['sponsor_id', 'organization_name', 'user_id'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['profile_url']
                }
              ],
            },
          ],
        },
      ],
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    if (application.student_id !== student.student_id) {
      res.status(403).json({
        success: false,
        message: "Unauthorized to view this application",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application,
    });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch application",
    });
  }
};

/**
 * Check if student has already applied to a scholarship
 */
export const checkApplicationExists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scholarship_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
      return;
    }

    const student = await Student.findOne({
      where: { user_id: user_id }
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
      return;
    }

    const application = await ScholarshipApplication.findOne({
      where: {
        student_id: student.student_id,
        scholarship_id,
      },
    });

    // If an application exists but was denied, allow the student to re-apply.
    const canReapply = !!application && application.status === 'denied';
    const exists = !!application && !canReapply;

    res.status(200).json({
      success: true,
      message: exists ? "Application exists" : (canReapply ? "Previous application denied - you may re-apply" : "No application found"),
      exists,
      can_reapply: canReapply,
      application: application || null,
    });
  } catch (error) {
    console.error("Check application error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to check application",
    });
  }
};

/**
 * Get all applications for a specific scholarship (sponsor-only)
 */
export const getScholarshipApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scholarship_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Get the sponsor record from the user_id
    const sponsor = await Sponsor.findOne({
      where: { user_id: user_id }
    });

    if (!sponsor) {
      res.status(404).json({
        success: false,
        message: "Sponsor profile not found",
      });
      return;
    }

    const scholarship = await Scholarship.findOne({
      where: {
        scholarship_id,
        sponsor_id: sponsor.sponsor_id,
      },
    });

    if (!scholarship) {
      res.status(404).json({
        success: false,
        message: "Scholarship not found or unauthorized",
      });
      return;
    }

    const applications = await ScholarshipApplication.findAll({
      where: { scholarship_id },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["student_id", "full_name", "gender", "date_of_birth", "contact_number"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email", "profile_url"],
            },
          ],
        },
      ],
      order: [["applied_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    console.error("Get scholarship applications error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch applications",
    });
  }
};

/**
 * Update application status (sponsor-only)
 */
export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { application_id } = req.params;
    const { status, remarks } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!status || !['shortlisted', 'approved', 'denied'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status (shortlisted/approved/denied) is required",
      });
      return;
    }

    // Get the sponsor record from the user_id
    const sponsor = await Sponsor.findOne({
      where: { user_id: user_id }
    });

    if (!sponsor) {
      res.status(404).json({
        success: false,
        message: "Sponsor profile not found",
      });
      return;
    }

    const application = await ScholarshipApplication.findByPk(application_id, {
      include: [
        {
          model: Scholarship,
          as: "scholarship",
        },
      ],
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    const scholarship = application.scholarship as any;
    if (scholarship.sponsor_id !== sponsor.sponsor_id) {
      res.status(403).json({
        success: false,
        message: "Unauthorized to update this application",
      });
      return;
    }

    await application.update({
      status,
      remarks: remarks || null,
    });

    // Create SelectedScholar entry if application is approved
    if (status === 'approved') {
      try {
        // Check if SelectedScholar entry already exists for this student-scholarship combination
        const existingSelection = await SelectedScholar.findOne({
          where: {
            student_id: application.student_id,
            scholarship_id: application.scholarship_id,
          },
        });

        // Only create if it doesn't already exist
        if (!existingSelection) {
          await SelectedScholar.create({
            student_id: application.student_id,
            scholarship_id: application.scholarship_id,
          });
        }
      } catch (error) {
        console.error("Error creating SelectedScholar entry:", error);
        // Don't fail the entire request if SelectedScholar creation fails
        // Log the error but still return success for the application update
      }
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update application status",
    });
  }
};

/**
 * Bulk update application statuses (sponsor-only)
 */
export const bulkUpdateApplicationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { application_ids, status, remarks } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "Application IDs array is required",
      });
      return;
    }

    if (!status || !['shortlisted', 'approved', 'denied'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status (shortlisted/approved/denied) is required",
      });
      return;
    }

    const sponsor = await Sponsor.findOne({
      where: { user_id: user_id }
    });

    if (!sponsor) {
      res.status(404).json({
        success: false,
        message: "Sponsor profile not found",
      });
      return;
    }

    // Fetch all applications and verify ownership
    const applications = await ScholarshipApplication.findAll({
      where: { 
        scholarship_application_id: application_ids 
      },
      include: [
        {
          model: Scholarship,
          as: "scholarship",
        },
      ],
    });

    if (applications.length === 0) {
      res.status(404).json({
        success: false,
        message: "No applications found",
      });
      return;
    }

    // Verify all scholarships belong to the sponsor
    const unauthorizedApp = applications.find((app) => {
      const scholarship = app.scholarship as any;
      return scholarship.sponsor_id !== sponsor.sponsor_id;
    });

    if (unauthorizedApp) {
      res.status(403).json({
        success: false,
        message: "Unauthorized to update one or more applications",
      });
      return;
    }

    // Bulk update
    await ScholarshipApplication.update(
      {
        status,
        remarks: remarks || null,
      },
      {
        where: {
          scholarship_application_id: application_ids,
        },
      }
    );

    // Create SelectedScholar entries if status is approved
    if (status === 'approved') {
      try {
        for (const application of applications) {
          // Check if SelectedScholar entry already exists
          const existingSelection = await SelectedScholar.findOne({
            where: {
              student_id: application.student_id,
              scholarship_id: application.scholarship_id,
            },
          });

          // Only create if it doesn't already exist
          if (!existingSelection) {
            await SelectedScholar.create({
              student_id: application.student_id,
              scholarship_id: application.scholarship_id,
            });
          }
        }
      } catch (error) {
        console.error("Error creating SelectedScholar entries:", error);
        // Don't fail the entire request if SelectedScholar creation fails
        // Log the error but still return success for the bulk update
      }
    }

    // Fetch updated applications
    const updatedApplications = await ScholarshipApplication.findAll({
      where: { scholarship_application_id: application_ids },
    });

    res.status(200).json({
      success: true,
      message: `${updatedApplications.length} application(s) updated successfully`,
      updated_count: updatedApplications.length,
      applications: updatedApplications,
    });
  } catch (error) {
    console.error("Bulk update application status error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update application statuses",
    });
  }
};