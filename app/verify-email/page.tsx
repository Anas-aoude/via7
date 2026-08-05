"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import useTranslation from "@/app/hooks/useTranslation";

type VerifyStatus = "loading" | "success" | "error";
type ResendStatus = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { t } = useTranslation();

  const hasVerified = useRef(false);

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (hasVerified.current) return;

    hasVerified.current = true;
    setMessage(t("auth.verifyingEmail"));

    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage(t("auth.invalidOrMissingVerificationLink"));
        return;
      }

      try {
        await axios.get(`/api/auth/verify-email?token=${token}`);

        setStatus("success");
        setMessage(t("auth.verificationSuccess"));
      } catch (error: any) {
        const apiError = error?.response?.data?.error;

        setStatus("error");

        if (apiError === "TOKEN_EXPIRED") {
          setMessage(t("auth.verificationLinkExpired"));
        } else if (apiError === "INVALID_TOKEN") {
          setMessage(t("auth.invalidVerificationLink"));
        } else if (apiError === "USER_NOT_FOUND") {
          setMessage(t("errors.userNotFound"));
        } else {
          setMessage(t("auth.verificationFailed"));
        }
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResendVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setResendStatus("error");
      setResendMessage(t("auth.emailRequired"));
      return;
    }

    try {
      setResendStatus("loading");
      setResendMessage("");

      await axios.post("/api/auth/resend-verification", {
        email: email.toLowerCase().trim(),
      });

      setResendStatus("success");
      setResendMessage(t("auth.verificationEmailSent"));
    } catch (error: any) {
      const apiError = error?.response?.data?.error;

      setResendStatus("error");

      if (apiError === "USER_NOT_FOUND") {
        setResendMessage(t("errors.userNotFound"));
      } else if (apiError === "EMAIL_ALREADY_VERIFIED") {
        setResendMessage(t("auth.emailAlreadyVerified"));
      } else if (apiError === "EMAIL_REQUIRED") {
        setResendMessage(t("auth.emailRequired"));
      } else {
        setResendMessage(t("auth.somethingWentWrong"));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-28">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`
            mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl
            ${status === "success" ? "bg-green-100 text-green-700" : ""}
            ${status === "error" ? "bg-red-100 text-red-700" : ""}
            ${status === "loading" ? "bg-neutral-100 text-neutral-600" : ""}
          `}
        >
          {status === "loading" && "⏳"}
          {status === "success" && "✓"}
          {status === "error" && "!"}
        </div>

        <h1 className="mb-3 text-2xl font-bold text-neutral-900">
          {status === "loading" && t("auth.verifyEmail")}
          {status === "success" && t("auth.emailVerifiedTitle")}
          {status === "error" && t("auth.verificationFailedTitle")}
        </h1>

        <p className="mb-6 text-sm leading-6 text-neutral-600">{message}</p>

        {status === "success" && (
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            {t("auth.goToLogin")}
          </Link>
        )}

        {status === "error" && (
          <div className="space-y-5">
            <form onSubmit={handleResendVerification} className="space-y-3">
              <div className="text-right">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  {t("auth.email")}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled={resendStatus === "loading"}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
                />
              </div>

              {resendMessage && (
                <p
                  className={`text-sm leading-6 ${
                    resendStatus === "success"
                      ? "text-green-700"
                      : "text-red-600"
                    }`}
                >
                  {resendMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={resendStatus === "loading"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resendStatus === "loading"
                  ? t("common.loading")
                  : t("auth.resendVerification")}
              </button>
            </form>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {t("common.back")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}