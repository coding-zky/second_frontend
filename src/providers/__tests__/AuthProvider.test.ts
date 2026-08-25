import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/providers/AuthProvider";

// Mock the authAPI
jest.mock("@/services/auth", () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

import { authAPI } from "@/services/auth";

const mockLogin = authAPI.login as jest.MockedFunction<typeof authAPI.login>;
const mockRegister = authAPI.register as jest.MockedFunction<typeof authAPI.register>;
const mockLogout = authAPI.logout as jest.MockedFunction<typeof authAPI.logout>;

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should set user and tokens on successful login", async () => {
      const mockResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: 1, email: "test@example.com" },
      };

      mockLogin.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.accessToken).toBe("access-token");
      expect(result.current.refreshToken).toBe("refresh-token");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set error on failed login", async () => {
      mockLogin.mockRejectedValue(new Error("邮箱或密码错误"));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login("test@example.com", "wrong");
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe("邮箱或密码错误");
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("register", () => {
    it("should set user and tokens on successful register", async () => {
      const mockResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: 1, email: "new@example.com" },
      };

      mockRegister.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register("new@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("logout", () => {
    it("should clear all auth state", async () => {
      // First login
      useAuthStore.setState({
        user: { id: 1, email: "test@example.com" },
        accessToken: "token",
        refreshToken: "refresh",
        isAuthenticated: true,
      });

      mockLogout.mockResolvedValue({ message: "登出成功" });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("clearError", () => {
    it("should clear error message", () => {
      useAuthStore.setState({ error: "Some error" });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
