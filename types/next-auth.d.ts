import type { DefaultSession } from "next-auth";

// Module augmentation: expose the database user id on the session and JWT so
// reads/writes can be scoped by `userId` everywhere `auth()` is called.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

// The callback `token` type resolves from @auth/core/jwt, so augment it too.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
  }
}
