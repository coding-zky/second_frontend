import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

// Mock useAuth hook with controllable state
const mockLogin = jest.fn();
const mockClearError = jest.fn();
let authError: string | null = null;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: authError,
    clearError: mockClearError,
  }),
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

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authError = null;
  });

  it("should render login form with email and password fields", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /登录/i })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录/i })).toBeInTheDocument();
  });

  it("should have a link to register page", () => {
    render(<LoginPage />);

    const registerLink = screen.getByText("立即注册");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("should call login with email and password on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登录/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("should navigate to home page after successful login", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登录/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should display error message when auth fails", () => {
    authError = "邮箱或密码错误";
    render(<LoginPage />);

    expect(screen.getByText("邮箱或密码错误")).toBeInTheDocument();
  });

  it("should clear error on form submit", async () => {
    mockLogin.mockRejectedValue(new Error("failed"));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登录/i }));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});
