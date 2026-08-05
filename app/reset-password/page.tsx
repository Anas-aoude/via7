"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import useTranslation from "../hooks/useTranslation";

type ResetStatus = "idle" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<ResetStatus>("idle");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setStatus("error");
      setMessage(t("auth.invalidOrMissingResetLink"));
      return;
    }

    if (!password || !confirmPassword) {
      setStatus("error");
      setMessage(t("errors.missingFields"));
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage(t("auth.passwordsDoNotMatch"));
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      await axios.post("/api/auth/reset-password", {
        token,
        password,
      });

      setStatus("success");
      setMessage(t("auth.passwordResetSuccess"));
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const apiError = error?.response?.data?.error;

      setStatus("error");

      if (apiError === "TOKEN_EXPIRED") {
        setMessage(t("auth.resetLinkExpired"));
      } else if (apiError === "INVALID_TOKEN") {
        setMessage(t("auth.invalidResetLink"));
      } else if (apiError === "PASSWORD_TOO_SHORT") {
        setMessage(t("auth.passwordTooShort"));
      } else {
        setMessage(t("auth.somethingWentWrong"));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-28">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-background text-3xl text-primary">
          🔒
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {t("auth.resetPassword")}
        </h1>

        <p className="mb-6 text-sm leading-6 text-muted">
          {t("auth.resetPasswordSubtitle")}
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4 text-start">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("auth.newPassword")}
            </label>

            <input
              type="password"
              value={password}
              disabled={status === "loading" || status === "success"}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-background"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("auth.confirmPassword")}
            </label>

            <input
              type="password"
              value={confirmPassword}
              disabled={status === "loading" || status === "success"}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-background"
            />
          </div>

          {message && (
            <p
              className={`text-center text-sm leading-6 ${
                status === "success" ? "text-success" : "text-danger"
                }`}
            >
              {message}
            </p>
          )}

          {status !== "success" && (
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading"
                ? t("common.loading")
                : t("auth.resetPassword")}
            </button>
          )}

          {status === "success" && (
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              {t("auth.goToLogin")}
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}