import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import Scholarship from "../models/Scholarship";
import Sponsor from "../models/Sponsor";
import User from "../models/Users";
import ScholarshipApplication from "../models/ScholarshipApplication";
import { containerClient } from "../config/azure";
import { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";
import { fn, col } from "sequelize";

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

// Create a new scholarship
export const createScholarship = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'sponsor') {
      return res.status(403).json({ 
        success: false,
        message: "Only sponsors can create scholarships." 
      });
    }

    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    if (!sponsor) {
      return res.status(404).json({ 
        success: false,
        message: "Sponsor profile not found." 
      });
    }

    const { 
      type, 
      purpose, 
      title, 
      description, 
      total_amount, 
      total_slot, 
      application_deadline, 
      criteria, 
      required_documents,
      custom_form_fields
    } = req.body;

    if (!title || !total_amount || !total_slot || !criteria || !required_documents || !custom_form_fields) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, total_amount, total_slot, criteria, required_documents, custom_form_fields"
      });
    }

    let criteriaArray = [];
    let documentsArray = [];
    let customFormFieldsArray = null;

    try {
      criteriaArray = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
      documentsArray = typeof required_documents === 'string' ? JSON.parse(required_documents) : required_documents;
      
      // Parse custom_form_fields if provided
      if (custom_form_fields) {
        customFormFieldsArray = typeof custom_form_fields === 'string' 
          ? JSON.parse(custom_form_fields) 
          : custom_form_fields;
        
        // Validate it's an array
        if (!Array.isArray(customFormFieldsArray)) {
          throw new Error('custom_form_fields must be an array');
        }
        
        // Validate each field structure
        for (const field of customFormFieldsArray) {
          const validTypes = ['text', 'textarea', 'dropdown', 'number', 'date', 'file', 'email', 'phone', 'checkbox'];
          
          if (!validTypes.includes(field.type)) {
            return res.status(400).json({
              success: false,
              message: `Invalid field type: ${field.type}`
            });
          }
          
          if (!field.label || typeof field.label !== 'string') {
            return res.status(400).json({
              success: false,
              message: 'Each field must have a label'
            });
          }
          
          if ((field.type === 'dropdown' || field.type === 'checkbox') && 
              (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
            return res.status(400).json({
              success: false,
              message: `${field.type} fields must have at least one option`
            });
          }
        }
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid format for criteria, required_documents, or custom_form_fields"
      });
    }

    // Create the scholarship
    const scholarship = await Scholarship.create({
      sponsor_id: sponsor.sponsor_id,
      status: 'active',
      type: type,
      purpose: purpose,
      title,
      description: description,
      total_amount: parseFloat(total_amount),
      total_slot: parseInt(total_slot),
      application_deadline: application_deadline ? new Date(application_deadline) : undefined,
      criteria: criteriaArray,
      required_documents: documentsArray,
      custom_form_fields: customFormFieldsArray,
      image_url: undefined, 
    });

    return res.status(201).json({
      success: true,
      message: "Scholarship created successfully",
      scholarship: {
        scholarship_id: scholarship.scholarship_id,
        sponsor_id: scholarship.sponsor_id,
        status: scholarship.status,
        type: scholarship.type,
        purpose: scholarship.purpose,
        title: scholarship.title,
        description: scholarship.description,
        total_amount: scholarship.total_amount,
        total_slot: scholarship.total_slot,
        application_deadline: scholarship.application_deadline,
        criteria: scholarship.criteria,
        required_documents: scholarship.required_documents,
        custom_form_fields: scholarship.custom_form_fields,
        image_url: scholarship.image_url,
        created_at: scholarship.created_at,
        updated_at: scholarship.updated_at,
      }
    });
  } catch (error) {
    console.error("Error creating scholarship:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating scholarship. Please try again later."
    });
  }
};

// Upload scholarship image
export const uploadScholarshipImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { scholarship_id } = req.params;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'sponsor') {
      return res.status(403).json({ 
        success: false,
        message: "Only sponsors can upload scholarship images." 
      });
    }

    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    if (!sponsor) {
      return res.status(404).json({ 
        success: false,
        message: "Sponsor profile not found." 
      });
    }

    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship) {
      return res.status(404).json({ 
        success: false,
        message: "Scholarship not found." 
      });
    }

    if (scholarship.sponsor_id !== sponsor.sponsor_id) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to upload images for this scholarship." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No image file provided." 
      });
    }

    if (scholarship.image_url) {
      try {
        const urlWithoutSas = scholarship.image_url.split('?')[0];
        const urlParts = urlWithoutSas.split('/');
        const oldBlobName = urlParts.slice(-2).join('/');
        const oldBlockBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        await oldBlockBlobClient.deleteIfExists();
      } catch (deleteError) {
        console.warn("Failed to delete old scholarship image:", deleteError);
      }
    }

    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `scholarship-${scholarship_id}-${uuidv4()}.${fileExtension}`;
    const blobName = `scholarships/${fileName}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype,
      },
    });

    const blobUrl = generateSasUrl(blobName);

    scholarship.image_url = blobUrl;
    await scholarship.save();

    return res.status(200).json({
      success: true,
      message: "Scholarship image uploaded successfully",
      image_url: blobUrl
    });
  } catch (error) {
    console.error("Error uploading scholarship image:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      : "Error uploading scholarship image. Please try again later.";
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Get all scholarships (public)
export const getAllScholarships = async (req: Request, res: Response) => {
  try {
    const scholarships = await Scholarship.findAll({
      include: [
        {
          model: Sponsor,
          as: 'sponsor',
          attributes: ['sponsor_id', 'organization_name'],
        }
      ],
      order: [['created_at', 'DESC']],
    });

    // Format the response
    const formattedScholarships = scholarships.map((scholarship: any) => {
      const scholarshipData = scholarship.toJSON();
      return {
        scholarship_id: scholarshipData.scholarship_id,
        sponsor_id: scholarshipData.sponsor_id,
        status: scholarshipData.status,
        type: scholarshipData.type,
        purpose: scholarshipData.purpose,
        title: scholarshipData.title,
        total_amount: scholarshipData.total_amount,
        total_slot: scholarshipData.total_slot,
        application_deadline: scholarshipData.application_deadline,
        criteria: scholarshipData.criteria,
        required_documents: scholarshipData.required_documents,
        custom_form_fields: scholarshipData.custom_form_fields || null,
        image_url: scholarshipData.image_url,
        created_at: scholarshipData.created_at,
        updated_at: scholarshipData.updated_at,
        sponsor: {
          sponsor_id: scholarshipData.sponsor?.sponsor_id,
          organization_name: scholarshipData.sponsor?.organization_name,
        }
      };
    });

    return res.status(200).json({
      success: true,
      scholarships: formattedScholarships
    });
  } catch (error) {
    console.error("Error getting scholarships:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting scholarships. Please try again later."
    });
  }
};

// Get sponsor's scholarships
export const getSponsorScholarships = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'sponsor') {
      return res.status(403).json({ 
        success: false,
        message: "Only sponsors can access." 
      });
    }

    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    if (!sponsor) {
      return res.status(404).json({ 
        success: false,
        message: "Sponsor profile not found." 
      });
    }

    const scholarships = await Scholarship.findAll({
      where: { sponsor_id: sponsor.sponsor_id },
      include: [
        {
          model: Sponsor,
          as: 'sponsor',
          attributes: ['sponsor_id', 'organization_name'],
        },
        {
          model: ScholarshipApplication,
          as: 'scholarship_applications',
          attributes: [],
        }
      ],
      attributes: {
        include: [
          [
            fn('COUNT', col('scholarship_applications.scholarship_application_id')),
            'applications_count'
          ]
        ]
      },
      group: [
        'Scholarship.scholarship_id',
        'sponsor.sponsor_id'
      ],
      order: [['created_at', 'DESC']],
      subQuery: false,
    });

    // Format the response with applications count
    const formattedScholarships = scholarships.map((scholarship: any) => {
      const scholarshipData = scholarship.toJSON();
      return {
        scholarship_id: scholarshipData.scholarship_id,
        sponsor_id: scholarshipData.sponsor_id,
        status: scholarshipData.status,
        type: scholarshipData.type,
        purpose: scholarshipData.purpose,
        title: scholarshipData.title,
        description: scholarshipData.description,
        total_amount: scholarshipData.total_amount,
        total_slot: scholarshipData.total_slot,
        application_deadline: scholarshipData.application_deadline,
        criteria: scholarshipData.criteria,
        required_documents: scholarshipData.required_documents,
        custom_form_fields: scholarshipData.custom_form_fields || null,
        image_url: scholarshipData.image_url,
        applications_count: parseInt(scholarshipData.applications_count) || 0,
        created_at: scholarshipData.created_at,
        updated_at: scholarshipData.updated_at,
        sponsor: {
          sponsor_id: scholarshipData.sponsor?.sponsor_id,
          organization_name: scholarshipData.sponsor?.organization_name,
        }
      };
    });

    return res.status(200).json({
      success: true,
      scholarships: formattedScholarships
    });
  } catch (error) {
    console.error("Error getting sponsor scholarships:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting scholarships. Please try again later."
    });
  }
};

// Get single scholarship 
export const getScholarshipById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scholarship_id } = req.params as { scholarship_id: string };

    const scholarship = await Scholarship.findByPk(scholarship_id, {
      include: [
        {
          model: Sponsor,
          as: 'sponsor',
          attributes: ['sponsor_id', 'organization_name'],
        },
        {
          model: ScholarshipApplication,
          as: 'scholarship_applications',
          attributes: [],
        }
      ],
      attributes: {
        include: [
          [
            fn('COUNT', col('scholarship_applications.scholarship_application_id')),
            'applications_count'
          ]
        ]
      },
      group: [
        'Scholarship.scholarship_id',
        'sponsor.sponsor_id'
      ],
      subQuery: false,
    });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found.'
      });
    }

    const scholarshipData = scholarship.toJSON() as any;

    return res.status(200).json({
      success: true,
      scholarship: {
        scholarship_id: scholarshipData.scholarship_id,
        sponsor_id: scholarshipData.sponsor_id,
        status: scholarshipData.status,
        type: scholarshipData.type,
        purpose: scholarshipData.purpose,
        title: scholarshipData.title,
        description: scholarshipData.description,
        total_amount: scholarshipData.total_amount,
        total_slot: scholarshipData.total_slot,
        application_deadline: scholarshipData.application_deadline,
        criteria: scholarshipData.criteria,
        required_documents: scholarshipData.required_documents,
        custom_form_fields: scholarshipData.custom_form_fields || null,
        image_url: scholarshipData.image_url,
        applications_count: parseInt(scholarshipData.applications_count || '0') || 0,
        created_at: scholarshipData.created_at,
        updated_at: scholarshipData.updated_at,
        sponsor: {
          sponsor_id: scholarshipData.sponsor?.sponsor_id,
          organization_name: scholarshipData.sponsor?.organization_name,
        }
      }
    });
  } catch (error) {
    console.error('Error getting scholarship by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting scholarship. Please try again later.'
    });
  }
};

// Update scholarship 
export const updateScholarship = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { scholarship_id } = req.params as { scholarship_id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'sponsor') {
      return res.status(403).json({
        success: false,
        message: 'Only sponsors can update scholarships.'
      });
    }

    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor profile not found.'
      });
    }

    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found.'
      });
    }

    if (scholarship.sponsor_id !== sponsor.sponsor_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this scholarship."
      });
    }

    const {
      type,
      purpose,
      title,
      description,
      total_amount,
      total_slot,
      application_deadline,
      criteria,
      required_documents,
      custom_form_fields,
      status,
    } = req.body as any;

    let criteriaArray: string[] | undefined = undefined;
    let documentsArray: string[] | undefined = undefined;
    let customFormFieldsArray: any = undefined;

    try {
      if (typeof criteria !== 'undefined') {
        criteriaArray = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
        if (!Array.isArray(criteriaArray)) throw new Error('criteria must be array');
      }
      if (typeof required_documents !== 'undefined') {
        documentsArray = typeof required_documents === 'string' ? JSON.parse(required_documents) : required_documents;
        if (!Array.isArray(documentsArray)) throw new Error('required_documents must be array');
      }
      if (typeof custom_form_fields !== 'undefined') {
        if (custom_form_fields === null) {
          throw new Error('custom_form_fields must not be null');
        } else {
          customFormFieldsArray = typeof custom_form_fields === 'string' 
            ? JSON.parse(custom_form_fields) 
            : custom_form_fields;
          if (!Array.isArray(customFormFieldsArray)) {
            throw new Error('custom_form_fields must be an array');
          }
        }
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format for criteria, required_documents, or custom_form_fields'
      });
    }

    if (typeof title !== 'undefined') scholarship.title = title;
    if (typeof description !== 'undefined') scholarship.description = description;
    if (typeof type !== 'undefined') scholarship.type = type;
    if (typeof purpose !== 'undefined') scholarship.purpose = purpose;
    if (typeof status !== 'undefined') scholarship.status = status;
    if (typeof total_amount !== 'undefined') scholarship.total_amount = parseFloat(total_amount);
    if (typeof total_slot !== 'undefined') scholarship.total_slot = parseInt(total_slot);
    if (typeof application_deadline !== 'undefined') scholarship.application_deadline = application_deadline ? new Date(application_deadline) : null as any;
    if (typeof criteriaArray !== 'undefined') scholarship.criteria = criteriaArray;
    if (typeof documentsArray !== 'undefined') scholarship.required_documents = documentsArray;
    if (typeof customFormFieldsArray !== 'undefined') scholarship.custom_form_fields = customFormFieldsArray;

    await scholarship.save();

    return res.status(200).json({
      success: true,
      message: 'Scholarship updated successfully',
      scholarship: scholarship.toJSON()
    });
  } catch (error) {
    console.error('Error updating scholarship:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating scholarship. Please try again later.'
    });
  }
};

// Delete scholarship (sponsor only and must own)
export const deleteScholarship = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { scholarship_id } = req.params as { scholarship_id: string };

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'sponsor') {
      return res.status(403).json({ success: false, message: 'Only sponsors can delete scholarships.' });
    }

    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });
    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor profile not found.' });
    }

    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    }

    if (scholarship.sponsor_id !== sponsor.sponsor_id) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this scholarship." });
    }

    // Attempt delete of associated image if exists
    if (scholarship.image_url) {
      try {
        const urlWithoutSas = scholarship.image_url.split('?')[0];
        const urlParts = urlWithoutSas.split('/');
        const oldBlobName = urlParts.slice(-2).join('/');
        const oldBlockBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        await oldBlockBlobClient.deleteIfExists();
      } catch (err) {
        console.warn('Failed to delete scholarship image during deletion:', err);
      }
    }

    await scholarship.destroy();

    return res.status(200).json({ success: true, message: 'Scholarship deleted successfully' });
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    return res.status(500).json({ success: false, message: 'Error deleting scholarship. Please try again later.' });
  }
};

export { upload };