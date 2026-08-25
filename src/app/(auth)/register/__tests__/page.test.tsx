import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/(auth)/register/page";

// Mock useAuth hook with controllable state
const mockRegister = jest.fn();
const mockClearError = jest.fn();
let authError: string | null = null;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    register: mockRegister,
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

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authError = null;
  });

  it("should render register form with email, password, and confirm password fields", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("heading", { name: /注册/i })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /注册/i })).toBeInTheDocument();
  });

  it("should have a link to login page", () => {
    render(<RegisterPage />);

    const loginLink = screen.getByText("立即登录");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("should call register with email and password on submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("确认密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /注册/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("should navigate to home page after successful register", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("确认密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /注册/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should not call register when passwords do not match", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("确认密码"), {
      target: { value: "differentPassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /注册/i }));

    // Wait a bit to ensure register is NOT called
    await new Promise((r) => setTimeout(r, 100));
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should display error message when auth fails", () => {
    authError = "该邮箱已被注册";
    render(<RegisterPage />);

    expect(screen.getByText("该邮箱已被注册")).toBeInTheDocument();
  });

  it("should clear error on form submit", async () => {
    mockRegister.mockRejectedValue(new Error("failed"));
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("确认密码"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /注册/i }));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});
