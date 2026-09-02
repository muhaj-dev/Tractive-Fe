import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "./config";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 1. Login to get token
          const loginRes = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
              method: "POST",
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              headers: { "Content-Type": "application/json" },
            },
          );

          const loginData = await loginRes.json();

          if (!loginRes.ok || !loginData.token) {
            const errorMsg = loginData.error || loginData.message || "Login failed";
            console.error("[AUTH] Login failed:", errorMsg, "Status:", loginRes.status);
            throw new Error(errorMsg);
          }

          // 2. Fetch User Profile to get roles
          const profileRes = await fetch(
            `${API_BASE_URL}/api/profile`,
            {
              headers: {
                Authorization: `Bearer ${loginData.token}`,
              },
            },
          );

          if (!profileRes.ok) {
            const errorText = await profileRes.text();
            console.error("[AUTH] Profile fetch failed:", profileRes.status, errorText);
            throw new Error("Failed to fetch user profile");
          }

          const profileData = await profileRes.json();
          const user = profileData.user || profileData;

          return {
            id: user._id || "user-id",
            name: user.name,
            email: user.email,
            image: user.image, // if any
            token: loginData.token,
            // `/api/auth/login` also sets the refresh token as an httpOnly
            // cookie, but on the *backend* origin and with SameSite=Lax — and
            // this login runs server-side, so that cookie never reaches the
            // browser at all. Carry the token from the response body instead,
            // so the axios interceptor has something to send on a 401.
            refreshToken: loginData.refreshToken,
            role: user.roles || user.role || [],
            activeRole: user.activeRole || null,
          };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error("[AUTH] Authorization failed:", error.message || error);
          console.error("[AUTH] Full error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle session updates (e.g. after onboarding, role switching, profile updates)
      if (trigger === "update") {
        // Fetch fresh user data from backend to sync session
        try {
          const profileRes = await fetch(
            `${API_BASE_URL}/api/profile`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            },
          );

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const freshUser = profileData.user || profileData;

            // Update token with fresh data from backend
            token.role = freshUser.roles || freshUser.role || [];
            token.activeRole = freshUser.activeRole || null;
            token.name = freshUser.name;
            token.email = freshUser.email;
          } else {
            console.error("Failed to fetch profile during session update");
          }
        } catch (error) {
          console.error("Error fetching profile during session update:", error);
        }

        // Also merge any explicit session data passed
        if (session) {
          return { ...token, ...session };
        }
      }

      // Initial sign in
      if (user) {
        token.accessToken = user.token;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.activeRole = user.activeRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.user.token = token.accessToken as string;
        session.user.role = token.role as string[];
        session.user.activeRole = token.activeRole as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
