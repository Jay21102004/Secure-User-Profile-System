export interface User {
  _id: string;
  name: string;
  email: string;
  aadhaarNumber?: string; // Only present in profile data (decrypted)
  age?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  profileImage?: string; // Base64 image data
  status: 'active' | 'inactive' | 'suspended';
  profileComplete: boolean;
  lastLogin?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    name: string;
    message: string;
    details?: any;
  };
  errors?: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  aadhaarNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  profileImage?: string;
}

export interface UpdateAadhaarRequest {
  aadhaarNumber: string;
  currentPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SecurityInfo {
  lastLogin?: string;
  emailVerified: boolean;
  accountCreated: string;
  isLocked: boolean;
  loginAttempts: number;
  lockUntil?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export interface FormErrors {
  [key: string]: string[];
}