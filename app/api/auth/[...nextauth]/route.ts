// Auth.js (NextAuth v5) route handlers. This catch-all is the framework's own
// authentication endpoint (CSRF / session / callback), not an application data
// API — all app mutations still go through Server Actions per the project rules.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
