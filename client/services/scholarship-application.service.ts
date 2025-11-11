import { authService } from './auth.service';

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ApplicationFormData {
  scholarship_id: string;
  custom_form_response: Array<{ label: string; value: any }>; 
}

export interface ApplicationFileUpload {
  fieldKey: string;
  files: Array<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  }>;
}

interface ScholarshipApplication {
  scholarship_application_id: string;
  student_id: string;
  scholarship_id: string;
  status: 'pending' | 'approved' | 'denied';
  remarks?: string;
  custom_form_response: Array<{ label: string; value: any }>; 
  applied_at: string;
  updated_at: string;
  student?: {
    student_id: string;
    full_name: string;
    gender?: string;
    date_of_birth: string;
    contact_number: string;
    user: {
      email: string;
      profile_url?: string;
    };
  };
}

class ScholarshipApplicationService {
  /**
   * Submit a scholarship application with custom form data
   */
  async submitApplication(
    scholarshipId: string,
    customFormResponse: Array<{ label: string; value: any }> 
  ): Promise<{
    success: boolean;
    application?: ScholarshipApplication;
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest('/scholarship-application/submit', {
        method: 'POST',
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          custom_form_response: customFormResponse,
        }),
      });

      return {
        success: response.success,
        application: response.data?.application,
        message: response.message || (response.success ? 'Application submitted successfully' : 'Failed to submit application'),
      };
    } catch (error) {
      console.error('Submit application error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit application',
      };
    }
  }

  /**
   * Upload files for a specific custom form field
   */
  async uploadApplicationFiles(
    applicationId: string,
    fieldKey: string,
    files: Array<{
      uri: string;
      name: string;
      mimeType: string;
      size?: number;
    }>
  ): Promise<{
    success: boolean;
    file_urls?: string[];
    message: string;
  }> {
    try {
      const token = await authService.getToken();

      if (!token) {
        return {
          success: false,
          message: 'No authentication token found',
        };
      }

      const formData = new FormData();
      formData.append('field_key', fieldKey);

      // Append all files
      files.forEach((file, index) => {
        const filename = file.name || `file_${index}.${file.mimeType?.split('/')[1] || 'bin'}`;
        
        formData.append('files', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: filename,
        } as any);
      });

      console.log(`Uploading ${files.length} file(s) for field: ${fieldKey}`);

      const response = await fetch(
        `${EXPO_API_URL}/scholarship-application/${applicationId}/upload-files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // DO NOT set Content-Type for FormData
          },
          body: formData,
        }
      );

      const result = await response.json();

      return {
        success: response.ok,
        file_urls: result.file_urls,
        message: result.message || (response.ok ? 'Files uploaded successfully' : 'Failed to upload files'),
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload files',
      };
    }
  }

  /**
   * Get all applications for the current student
   */
  async getMyApplications(): Promise<{
    success: boolean;
    applications?: ScholarshipApplication[];
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest('/scholarship-application/my-applications', {
        method: 'GET',
      });

      return {
        success: response.success,
        applications: response.data?.applications,
        message: response.message || (response.success ? 'Applications fetched successfully' : 'Failed to fetch applications'),
      };
    } catch (error) {
      console.error('Fetch applications error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch applications',
      };
    }
  }

  /**
   * Get a specific application by ID
   */
  async getApplicationById(applicationId: string): Promise<{
    success: boolean;
    application?: ScholarshipApplication;
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest(
        `/scholarship-application/${applicationId}`,
        {
          method: 'GET',
        }
      );

      return {
        success: response.success,
        application: response.data?.application,
        message: response.message || (response.success ? 'Application fetched successfully' : 'Failed to fetch application'),
      };
    } catch (error) {
      console.error('Fetch application error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch application',
      };
    }
  }

  /**
   * Check if student has already applied to a scholarship
   */
  async checkApplicationExists(scholarshipId: string): Promise<{
    success: boolean;
    exists: boolean;
    application?: ScholarshipApplication;
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest(
        `/scholarship-application/check/${scholarshipId}`,
        {
          method: 'GET',
        }
      );

      return {
        success: response.success,
        exists: response.data?.exists || false,
        application: response.data?.application,
        message: response.message || 'Check completed',
      };
    } catch (error) {
      console.error('Check application error:', error);
      return {
        success: false,
        exists: false,
        message: error instanceof Error ? error.message : 'Failed to check application',
      };
    }
  }

  /**
   * Get all applications for a specific scholarship (sponsor-only)
   */
  async getScholarshipApplications(scholarshipId: string): Promise<{
    success: boolean;
    applications?: ScholarshipApplication[];
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest(
        `/scholarship-application/scholarship/${scholarshipId}`,
        {
          method: 'GET',
        }
      );

      return {
        success: response.success,
        applications: response.data?.applications,
        message: response.message || (response.success ? 'Applications fetched successfully' : 'Failed to fetch applications'),
      };
    } catch (error) {
      console.error('Fetch scholarship applications error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch applications',
      };
    }
  }

  /**
   * Update application status (sponsor-only)
   */
  async updateApplicationStatus(
    applicationId: string,
    status: 'approved' | 'denied',
    remarks?: string
  ): Promise<{
    success: boolean;
    application?: ScholarshipApplication;
    message: string;
  }> {
    try {
      const response = await authService.authenticatedRequest(
        `/scholarship-application/${applicationId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status,
            remarks,
          }),
        }
      );

      return {
        success: response.success,
        application: response.data?.application,
        message: response.message || (response.success ? 'Status updated successfully' : 'Failed to update status'),
      };
    } catch (error) {
      console.error('Update application status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update application status',
      };
    }
  }
}

export const scholarshipApplicationService = new ScholarshipApplicationService();