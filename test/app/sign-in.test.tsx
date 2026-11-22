import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SignInButton } from "@/components/auth/AuthButton";
import { I18nProvider } from "@/components/i18n/I18nProvider";

const auth = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/series" }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));
beforeEach(() => { auth.signInWithOAuth.mockReset(); });
afterEach(cleanup);

it("opens sign-in options without starting OAuth from the header", () => {
  render(<SignInButton />);
  expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
  expect(screen.getByRole("dialog", { name: "Sign in" })).toBeInTheDocument();
  expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("starts Google OAuth only from the dialog and prevents duplicate requests", async () => {
  auth.signInWithOAuth.mockReturnValue(new Promise(() => {}));
  render(<SignInButton />);
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "google", options: {
    redirectTo: "http://localhost:3000/auth/callback?next=%2Fseries",
  } });
  expect(screen.getByRole("button", { name: "Connecting…" })).toBeDisabled();
});

it.each(["returned", "thrown"])("shows a retryable error for %s OAuth failures", async kind => {
  if (kind === "returned") auth.signInWithOAuth.mockResolvedValue({ data: { provider: "google", url: null }, error: new Error("Provider unavailable") });
  else auth.signInWithOAuth.mockRejectedValue(new Error("Network failure"));
  render(<SignInButton />);
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign in. Please try again.");
  expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  auth.signInWithOAuth.mockReturnValue(new Promise(() => {}));
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

it("translates the guest entry and sign-in dialog into Ukrainian", () => {
  render(<I18nProvider initialLocale="uk"><SignInButton /></I18nProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Увійти/ }));
  expect(screen.getByRole("dialog", { name: "Увійти" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Продовжити з Google" })).toBeInTheDocument();
});
