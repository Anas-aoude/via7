import { Button, Hr, Link, Text } from "react-email";
import EmailLayout from "./EmailLayout";

interface ForgotPasswordProps {
  resetUrl: string;
}

export default function ForgotPassword({ resetUrl }: ForgotPasswordProps) {
  return (
    <EmailLayout
      preview="Reset your VIA7 password"
      title="Reset your password"
    >
      <Text style={text}>
        We received a request to reset your VIA7 password. Click the button
        below to create a new password.
      </Text>

      <Button href={resetUrl} style={button}>
        Reset Password
      </Button>

      <Text style={smallText}>This link expires in 1 hour.</Text>

      <Hr style={divider} />

      <Text style={smallText}>
        If the button does not work, copy and paste this link into your browser:
      </Text>

      <Link href={resetUrl} style={link}>
        {resetUrl}
      </Link>

      <Text style={warning}>
        If you did not request a password reset, you can safely ignore this
        email.
      </Text>
    </EmailLayout>
  );
}

const text = {
  margin: "0 0 28px",
  fontSize: "16px",
  lineHeight: "26px",
  color: "#555555",
  textAlign: "center" as const,
};

const button = {
  display: "block",
  width: "100%",
  backgroundColor: "#C3984C",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "15px 0",
  borderRadius: "14px",
  margin: "0 auto 22px",
};

const smallText = {
  margin: "0 0 12px",
  fontSize: "13px",
  lineHeight: "22px",
  color: "#777777",
  textAlign: "center" as const,
};

const divider = {
  borderColor: "#E6E2DA",
  margin: "28px 0",
};

const link = {
  display: "block",
  fontSize: "12px",
  lineHeight: "20px",
  color: "#C3984C",
  wordBreak: "break-all" as const,
  textAlign: "center" as const,
};

const warning = {
  margin: "28px 0 0",
  fontSize: "12px",
  lineHeight: "20px",
  color: "#999999",
  textAlign: "center" as const,
};