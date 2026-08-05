import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

interface EmailLayoutProps {
  preview: string;
  title: string;
  children: React.ReactNode;
}

export default function EmailLayout({
  preview,
  title,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>

      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brand}>VIA7</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>{title}</Heading>
            {children}
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} VIA7. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  margin: "0",
  padding: "0",
  backgroundColor: "#F8F7F4",
  fontFamily:
    "Montserrat, Arial, Helvetica, sans-serif",
};

const container = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px 20px",
};

const brandSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const brand = {
  margin: "0",
  fontSize: "30px",
  fontWeight: "800",
  letterSpacing: "4px",
  color: "#C3984C",
};

const card = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E6E2DA",
  borderRadius: "22px",
  padding: "40px 32px",
  boxShadow: "0 8px 30px rgba(0,0,0,.08)",
};

const heading = {
  margin: "0 0 18px",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: "800",
  color: "#1A1A1A",
  textAlign: "center" as const,
};

const footer = {
  margin: "24px 0 0",
  fontSize: "12px",
  lineHeight: "20px",
  color: "#8A8A8A",
  textAlign: "center" as const,
};