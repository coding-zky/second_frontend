const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDto {
  id: number;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const authAPI = {
  register: (data: RegisterRequest) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (data: RefreshTokenRequest) =>
    request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (data: RefreshTokenRequest) =>
    request<{ message: string }>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: (accessToken: string) =>
    request<UserDto>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
