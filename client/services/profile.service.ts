import { authService } from './auth.service';

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ProfileData {
  id: string;
  email: string;
  role: string;
  profile_url?: string;
  has_selected_role: boolean;
  // Student fields
  full_name?: string;
  gender?: string;
  date_of_birth?: string;
  contact_number?: string;
  has_completed_profile?: boolean;
  // Sponsor fields
  sponsor_id?: string;
  organization_name?: string;
  organization_type?: string;
}

export interface StudentProfileData {
  full_name: string;
  gender?: string;
  date_of_birth: string;
  contact_number: string;
}

export interface SponsorProfileData {
  organization_name: string;
  organization_type?: string;
  contact_number: string;
}

class ProfileService {
  async getProfile(): Promise<{ success: boolean; profile?: ProfileData; message: string }> {
    const response = await authService.authenticatedRequest('/profile/profile', {
      method: 'GET'
    });

    return {
      success: response.success,
      profile: response.data?.profile,
      message: response.message
    };
  }

  async updateProfile(profileData: Partial<StudentProfileData | SponsorProfileData>): Promise<{ success: boolean; profile?: any; message: string }> {
    const response = await authService.authenticatedRequest('/profile/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    return {
      success: response.success,
      profile: response.data?.student || response.data?.sponsor,
      message: response.message
    };
  }

  async uploadProfilePicture(imageUri: string): Promise<{ success: boolean; profile_url?: string; message: string }> {
    try {
      const token = await authService.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No authentication token found'
        };
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(`${EXPO_API_URL}/profile/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      return {
        success: response.ok,
        profile_url: result.profile_url,
        message: result.message || (response.ok ? 'Profile picture uploaded successfully' : 'Failed to upload profile picture')
      };
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return {
        success: false,
        message: `Failed to connect to server at ${EXPO_API_URL}`
      };
    }
  }

  async deleteProfilePicture(): Promise<{ success: boolean; message: string }> {
    const response = await authService.authenticatedRequest('/profile/profile/picture', {
      method: 'DELETE'
    });

    return {
      success: response.success,
      message: response.message
    };
  }
}

export const profileService = new ProfileService();