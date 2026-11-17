import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Engineer } from "./account";
import { createServerSupabase } from "./supabase-server";

/** Session cookie: a random token. Only its SHA-256 hash is stored in the database. */
export const SESSION_COOKIE = "zr_session";
/** Resident session cookie. Separate from the engineer's, so one can never be read as the other. */
export const RESIDENT_SESSION_COOKIE = "zr_resident";
const SESSION_DAYS = 30;

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** Hash a password with scrypt and a random salt. The plain password is never stored or logged. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// Used when the username does not exist, so a wrong username takes as long as a wrong password.
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

export async function verifyPassword(password: string, stored: string | null) {
  const [scheme, N, r, p, salt, hash] = (stored ?? (await DUMMY_HASH)).split("$");
  if (scheme !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected) && stored !== null;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Start a session; returns the cookie to set. */
export async function createSession(engineerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  const { error } = await createServerSupabase()
    .from("sessions")
    .insert({ token_hash: hashToken(token), engineer_id: engineerId, expires_at: expires.toISOString() });
  if (error) throw new Error(`createSession: ${error.message}`);
  return sessionCookie(token, expires);
}

export function sessionCookie(value: string, expires: Date, name = SESSION_COOKIE) {
  return {
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export const clearedSessionCookie = () => sessionCookie("", new Date(0));

export async function deleteSession(token: string | undefined) {
  if (!token) return;
  await createServerSupabase().from("sessions").delete().eq("token_hash", hashToken(token));
}

/** Start a resident session (its own table and cookie); returns the cookie to set. */
export async function createResidentSession(residentId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  const { error } = await createServerSupabase()
    .from("resident_sessions")
    .insert({ token_hash: hashToken(token), resident_id: residentId, expires_at: expires.toISOString() });
  if (error) throw new Error(`createResidentSession: ${error.message}`);
  return sessionCookie(token, expires, RESIDENT_SESSION_COOKIE);
}

export const clearedResidentSessionCookie = () => sessionCookie("", new Date(0), RESIDENT_SESSION_COOKIE);

/** Ends only this browser's resident session: every visitor shares one resident. */
export async function deleteResidentSession(token: string | undefined) {
  if (!token) return;
  await createServerSupabase().from("resident_sessions").delete().eq("token_hash", hashToken(token));
}

/** The resident id behind a resident session token, or null if there is no valid session. */
export async function residentForToken(token: string | undefined): Promise<string | null> {
  if (!token || token.length > 100) return null;
  const { data, error } = await createServerSupabase()
    .from("resident_sessions")
    .select("resident_id")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<{ resident_id: string }>();
  if (error) throw new Error(`residentForToken: ${error.message}`);
  return data?.resident_id ?? null;
}

type EngineerRow = {
  id: string;
  full_name: string;
  discipline: Engineer["discipline"];
  contact: string;
  oea_number: string;
  approved_at: string | null;
};

export const toEngineer = (row: EngineerRow): Engineer => ({
  id: row.id,
  fullName: row.full_name,
  discipline: row.discipline,
  contact: row.contact,
  oeaNumber: row.oea_number,
  approved: row.approved_at !== null,
});

/** The engineer behind a session token, or null if there is no valid session. */
export async function engineerForToken(token: string | undefined): Promise<Engineer | null> {
  if (!token || token.length > 100) return null;
  const { data, error } = await createServerSupabase()
    .from("sessions")
    .select("expires_at, engineers(id, full_name, discipline, contact, oea_number, approved_at)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<{ expires_at: string; engineers: EngineerRow }>();
  if (error) throw new Error(`engineerForToken: ${error.message}`);
  return data?.engineers ? toEngineer(data.engineers) : null;
}

/** Hashed visitor IP, for rate limits. The raw IP is never stored. */
export function visitorHash(headers: Headers) {
  const ip = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`${process.env.SUPABASE_SECRET_KEY}:${ip}`).digest("hex");
}
