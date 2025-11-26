import * as SecureStore from 'expo-secure-store';

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface AuthToken {
  token: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message: string;
  data?: T;
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

class AuthService {
  private readonly TOKEN_KEY = 'authToken';

  async storeToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async authenticatedRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message: string; status: number }> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No authentication token found',
          status: 401
        };
      }

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${EXPO_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const result = await response.json();

      return {
        success: response.ok,
        data: result,
        message: result.message || (response.ok ? 'Request successful' : 'Request failed'),
        status: response.status
      };
    } catch (error) {
      console.error('Authenticated request error:', error);
      return {
        success: false,
        message: `Failed to connect to server at ${EXPO_API_URL}`,
        status: 0
      };
    }
  }

  async getProfileStatus(): Promise<{ success: boolean; user?: any; message: string }> {
    const response = await this.authenticatedRequest('/onboarding/profile-status', {
      method: 'POST'
    });

    return {
      success: response.success,
      user: response.data?.user,
      message: response.message
    };
  }

  async selectRole(role: 'student' | 'sponsor'): Promise<{ success: boolean; message: string; currentRole?: string }> {
    const response = await this.authenticatedRequest('/onboarding/select-role', {
      method: 'POST',
      body: JSON.stringify({ role })
    });

    return {
      success: response.success,
      message: response.message,
      currentRole: response.data?.user?.role
    };
  }

  async setupStudentProfile(profileData: StudentProfileData): Promise<{ success: boolean; message: string; student?: any }> {
    const response = await this.authenticatedRequest('/onboarding/setup-student-profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });

    return {
      success: response.success,
      message: response.message,
      student: response.data?.student
    };
  }

  async setupSponsorProfile(profileData: SponsorProfileData): Promise<{ success: boolean; message: string; sponsor?: any }> {
    const response = await this.authenticatedRequest('/onboarding/setup-sponsor-profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });

    return {
      success: response.success,
      message: response.message,
      sponsor: response.data?.sponsor
    };
  }
}

export const authService = new AuthService();