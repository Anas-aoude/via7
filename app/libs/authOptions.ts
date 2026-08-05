import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import prisma from "@/app/libs/prismadb";
import { RateLimitService } from "@/app/services/rate-limit";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (
          !email ||
          !password ||
          email.length > 254 ||
          password.length > 200 ||
          !isValidEmail(email)
        ) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const rateLimit = await RateLimitService.login(email);

        if (!rateLimit.success) {
          throw new Error("TOO_MANY_LOGIN_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.isBanned) {
          throw new Error("USER_BANNED");
        }

        const isCorrectPassword = await bcrypt.compare(
          password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error("INVALID_CREDENTIALS");
        }

        return user;
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email || !isValidEmail(user.email)) {
          return false;
        }

        const normalizedEmail = user.email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
            emailVerified: true,
            isBanned: true,
          },
        });

        if (existingUser?.isBanned) {
          return false;
        }

        if (existingUser && !existingUser.emailVerified) {
          await prisma.user.update({
            where: {
              email: normalizedEmail,
            },
            data: {
              emailVerified: new Date(),
            },
          });
        }
      }

      return true;
    },
  },

  debug:
    process.env.NODE_ENV !== "production" &&
    process.env.NEXTAUTH_DEBUG === "true",

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  useSecureCookies: process.env.NODE_ENV === "production",

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};