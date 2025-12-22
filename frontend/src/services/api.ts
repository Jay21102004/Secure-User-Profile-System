import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  UpdateAadhaarRequest,
  ChangePasswordRequest,
  User,
  SecurityInfo
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private tokenKey = 'lenden_token';
  private refreshTokenKey = 'lenden_refresh_token';

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await this.refreshAuthToken(refreshToken);
              if (response.data) {
                this.setTokens(response.data.token, response.data.refreshToken);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              this.clearTokens();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token, redirect to login
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  setTokens(token: string, refreshToken: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async verifyOTP(userId: string, otp: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/verify-otp', { userId, otp });
    return response.data;
  }

  async resendOTP(userId: string): Promise<ApiResponse<{ email: string; otpSent: boolean }>> {
    const response = await this.api.post<ApiResponse<{ email: string; otpSent: boolean }>>(
      '/auth/resend-otp', 
      { userId }
    );
    return response.data;
  }

  async refreshAuthToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    const response = await this.api.post<ApiResponse<{ token: string; refreshToken: string }>>(
      '/auth/refresh', 
      { refreshToken }
    );
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>('/auth/logout');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  }

  // User profile endpoints
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get<ApiResponse<{ user: User }>>('/user/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.put<ApiResponse<{ user: User }>>('/user/profile', data);
    return response.data;
  }

  async updateAadhaar(data: UpdateAadhaarRequest): Promise<ApiResponse> {
    const response = await this.api.put<ApiResponse>('/user/aadhaar', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    const response = await this.api.put<ApiResponse>('/user/password', data);
    return response.data;
  }

  async deleteAccount(password: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>('/user/account', {
      data: {
        password,
        confirmDeletion: 'DELETE_MY_ACCOUNT'
      }
    });
    return response.data;
  }

  async getSecurityInfo(): Promise<ApiResponse<SecurityInfo>> {
    const response = await this.api.get<ApiResponse<SecurityInfo>>('/user/security');
    return response.data;
  }

  // Profile with image upload
  async updateProfileWithImage(data: UpdateProfileRequest, imageFile?: File): Promise<ApiResponse<{ user: User }>> {
    const formData = new FormData();
    
    // Add profile data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add image file if provided
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }
    
    const response = await this.api.put<ApiResponse<{ user: User }>>(
      '/user/profile-with-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  // Download encrypted PDF
  async downloadProfilePDF(password: string): Promise<Blob> {
    const response = await this.api.post(
      '/user/download-pdf',
      { password },
      {
        responseType: 'blob'
      }
    );
    return response.data;
  }

  // Health check endpoints
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.api.get<ApiResponse>('/health');
    return response.data;
  }

  async authHealthCheck(): Promise<ApiResponse> {
    const response = await this.api.get<ApiResponse>('/auth/health');
    return response.data;
  }

  async userHealthCheck(): Promise<ApiResponse> {
    const response = await this.api.get<ApiResponse>('/user/health');
    return response.data;
  }
}

export default new ApiService();