export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  location?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
