import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,

  /*
   * JWT strategy allows GitHub authentication and your existing
   * email/password authentication to use the same session system.
   */
  session: {
    strategy: "jwt",
  },

  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email" } },
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      authorization: { params: { scope: "openid email profile" } },
      allowDangerousEmailAccountLinking: true,
    }),

    /*
     * Keeps existing email/password accounts available.
     * Your signup route can remain responsible for creating users.
     */
    Credentials({
      name: "Email and password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email
          .trim()
          .toLowerCase();

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        // GitHub-only users do not have passwords.
        if (!user?.password) {
          return null;
        }

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const providerProfile = profile as {
        email?: unknown;
        email_verified?: unknown;
      };
      const email =
        typeof providerProfile.email === "string"
          ? providerProfile.email.trim().toLowerCase()
          : null;

      // Auth.js only links an OAuth identity to an existing email account
      // when explicitly enabled. Restrict that exception to email identities
      // which the provider has verified.
      if (!email) return false;

      if (account.provider === "google") {
        return providerProfile.email_verified === true;
      }

      if (account.provider === "github" && account.access_token) {
        const response = await fetch("https://api.github.com/user/emails", {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${account.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) return false;

        const emails = (await response.json()) as Array<{
          email?: string;
          verified?: boolean;
          primary?: boolean;
        }>;
        return emails.some(
          (item) =>
            item.primary === true &&
            item.verified === true &&
            item.email?.trim().toLowerCase() === email
        );
      }

      return false;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});
