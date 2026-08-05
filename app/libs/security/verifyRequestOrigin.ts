import { NextResponse } from "next/server";

const normalizeOrigin = (
  value: string | null | undefined
): string | null => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = new Set(
  [
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(process.env.NEXTAUTH_URL),

    // Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter((value): value is string => Boolean(value))
);

export function verifyRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");

  // SSR, curl and some server-to-server requests may not send Origin
  if (!originHeader) {
    return null;
  }

  const origin = normalizeOrigin(originHeader);
  const requestOrigin = normalizeOrigin(request.url);

  if (!origin) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    );
  }

  // Allow genuine same-origin requests
  if (requestOrigin && origin === requestOrigin) {
    return null;
  }

  if (allowedOrigins.has(origin)) {
    return null;
  }

  return NextResponse.json(
    { error: "Invalid request origin" },
    { status: 403 }
  );
}