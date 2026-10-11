import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const generateToken = () => randomBytes(32).toString("base64url"); // 43 chars
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const isTokenFormat = (token: string) =>
  /^[A-Za-z0-9_-]{43}$/.test(token);
