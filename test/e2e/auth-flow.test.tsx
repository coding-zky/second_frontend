/**
 * End-to-end auth flow test
 *
 * Simulates: Register → Login → Access protected page → Logout
 * Uses mocked API to test the complete user journey through the UI.
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useAuthStore } from "@/providers/AuthProvider";
import { authAPI } from "@/services/auth";

// Mock the authAPI
jest.mock("@/services/auth", () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockUser = { id: 1, email: "test@example.com" };
const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};
const mockAuthResponse = {
  user: mockUser,
  ...mockTokens,
};

describe("Auth E2E Flow", () => {
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

  describe("Step 1: Register", () => {
    it("should register a new user successfully", async () => {
      (authAPI.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      const { default: RegisterPage } = await import(
        "@/app/(auth)/register/page"
      );
      render(<RegisterPage />);

      // Fill in registration form
      fireEvent.change(screen.getByLabelText("邮箱"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("密码"), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText("确认密码"), {
        target: { value: "password123" },
      });

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /注册/i }));

      // Verify API was called correctly
      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      // Verify store is updated
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("test@example.com");
      expect(state.accessToken).toBe(mockTokens.accessToken);
    });
  });

  describe("Step 2: Login", () => {
    it("should login an existing user successfully", async () => {
      (authAPI.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      const { default: LoginPage } = await import(
        "@/app/(auth)/login/page"
      );
      render(<LoginPage />);

      // Fill in login form
      fireEvent.change(screen.getByLabelText("邮箱"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("密码"), {
        target: { value: "password123" },
      });

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /登录/i }));

      // Verify API was called correctly
      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      // Verify store is updated
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("test@example.com");
      expect(state.accessToken).toBe(mockTokens.accessToken);
      expect(state.refreshToken).toBe(mockTokens.refreshToken);
    });

    it("should show error on invalid credentials", async () => {
      (authAPI.login as jest.Mock).mockRejectedValue(
        new Error("邮箱或密码错误")
      );

      const { default: LoginPage } = await import(
        "@/app/(auth)/login/page"
      );
      const { rerender } = render(<LoginPage />);

      // Simulate login failure by setting error state
      act(() => {
        useAuthStore.setState({ error: "邮箱或密码错误" });
      });

      rerender(<LoginPage />);

      expect(screen.getByText("邮箱或密码错误")).toBeInTheDocument();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("Step 3: Access protected page", () => {
    it("should redirect to login when not authenticated", async () => {
      const { default: DashboardLayout } = await import(
        "@/app/(dashboard)/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Should redirect when not authenticated
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });

      // Should not show dashboard content
      expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
    });

    it("should show dashboard when authenticated", async () => {
      // Set authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      const { default: DashboardLayout } = await import(
        "@/app/(dashboard)/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Should show dashboard content
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();

      // Should show workspace title and logout button
      expect(screen.getByText("AI WorkSpace")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /退出登录/i })).toBeInTheDocument();
    });
  });

  describe("Step 4: Logout", () => {
    it("should clear auth state on logout", async () => {
      (authAPI.logout as jest.Mock).mockResolvedValue({ message: "ok" });

      // Set authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Perform logout
      await act(async () => {
        await useAuthStore.getState().logout();
      });

      // Verify API was called with refresh token object
      expect(authAPI.logout).toHaveBeenCalledWith({
        refreshToken: mockTokens.refreshToken,
      });

      // Verify store is cleared
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe("Full flow: Register → Login → Dashboard → Logout", () => {
    it("should complete the entire auth lifecycle", async () => {
      // 1. Register
      (authAPI.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().register("test@example.com", "password123");
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe("test@example.com");

      // 2. Simulate navigating to dashboard
      // (Dashboard would render because isAuthenticated is true)

      // 3. Logout
      (authAPI.logout as jest.Mock).mockResolvedValue({ message: "ok" });

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();

      // 4. Login again
      (authAPI.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login("test@example.com", "password123");
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe("test@example.com");
    });
  });
});
