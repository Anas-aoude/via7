import { Button, Hr, Link, Text } from "react-email";
import EmailLayout from "./EmailLayout";

interface VerifyEmailProps {
  verificationUrl: string;
}

export default function VerifyEmail({ verificationUrl }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your VIA7 email address"
      title="Verify your email address"
    >
      <Text style={text}>
        Welcome to VIA7. Please verify your email address to activate your
        account and unlock all features.
      </Text>

      <Button href={verificationUrl} style={button}>
        Verify Email
      </Button>

      <Text style={smallText}>
        This link expires in 24 hours.
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        If the button does not work, copy and paste this link into your browser:
      </Text>

      <Link href={verificationUrl} style={link}>
        {verificationUrl}
      </Link>

      <Text style={warning}>
        If you did not create a VIA7 account, you can safely ignore this email.
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