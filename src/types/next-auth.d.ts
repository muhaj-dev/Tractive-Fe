import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      token?: string;
      role?: string[];
      activeRole?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    token?: string;
    refreshToken?: string;
    role?: string[];
    activeRole?: string | null;
    roles?: string[]; // API might return "roles"
    _id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string[];
    activeRole?: string | null;
  }
}
