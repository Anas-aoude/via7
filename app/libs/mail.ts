import { Resend } from "resend";
import { render } from "react-email";

import VerifyEmail from "@/app/emails/VerifyEmail";
import ForgotPassword from "@/app/emails/ForgotPassword";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined");
  }

  return new Resend(apiKey);
}

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not defined");
  }

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = await render(
    VerifyEmail({
      verificationUrl,
    })
  );

  const resend = getResend();

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM || "VIA7 <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email - VIA7",
    html,
    text: `Welcome to VIA7. Verify your email here: ${verificationUrl}`,
  });

  if (result.error) {
    console.error("SEND_VERIFICATION_EMAIL_ERROR", result.error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not defined");
  }

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const html = await render(
    ForgotPassword({
      resetUrl,
    })
  );

  const resend = getResend();

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM || "VIA7 <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password - VIA7",
    html,
    text: `Reset your VIA7 password here: ${resetUrl}`,
  });

  if (result.error) {
    console.error("SEND_PASSWORD_RESET_EMAIL_ERROR", result.error);
    throw new Error("Failed to send password reset email");
  }
}