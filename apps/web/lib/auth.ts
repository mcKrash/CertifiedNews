const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

export interface UserPreferences {
  topicsOfInterest: string[];
  preferredLanguage: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  userType: string;
  bio?: string | null;
  avatarUrl?: string | null;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  emailVerified?: boolean;
  preferences?: UserPreferences | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    verificationEmailSent?: boolean;
    verificationEmailReason?: string | null;
  };
}

const persistAuth = (response: AuthResponse) => {
  if (typeof window === 'undefined') {
    return;
  }

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (token) {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const loginUser = async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: emailOrUsername, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  persistAuth(data);
  return data;
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  userType: string = 'REGULAR_USER',
  username?: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name, userType, username }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  persistAuth(data);
  return data;
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return getCurrentUser();
  }

  const data = await response.json();
  if (data?.data) {
    localStorage.setItem('user', JSON.stringify(data.data));
    return data.data;
  }

  return getCurrentUser();
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const resendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
  const response = await authenticatedFetch(`${API_URL}/auth/resend-verification-email`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to resend verification email');
  }

  return data;
};
