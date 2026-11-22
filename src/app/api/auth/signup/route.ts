import { NextResponse, type NextRequest } from "next/server";
import { validateSignup, type SignupInput } from "@/lib/account";
import { LOGIN_FROZEN, LOGIN_OFF } from "@/lib/maps";
import { createSession, hashPassword, visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

const MAX_BODY_BYTES = 4 * 1024;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Create a demo account. It starts waiting for (simulated) approval. */
export async function POST(req: NextRequest) {
  if (LOGIN_FROZEN) return json({ error: LOGIN_OFF }, 404);
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "This request is too large." }, 413);

  let input: SignupInput;
  try {
    const body = JSON.parse(raw);
    input = {
      fullName: String(body.fullName ?? ""),
      discipline: String(body.discipline ?? ""),
      contact: String(body.contact ?? ""),
      oeaNumber: String(body.oeaNumber ?? ""),
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
    };
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const fields = validateSignup(input);
  if (Object.keys(fields).length) return json({ error: "Some fields need attention.", fields }, 422);

  try {
    const { data: id, error } = await createServerSupabase().rpc("create_engineer", {
      p: {
        full_name: input.fullName.trim(),
        discipline: input.discipline,
        contact: input.contact.trim(),
        oea_number: input.oeaNumber.trim(),
        username: input.username.trim(),
        password_hash: await hashPassword(input.password),
      },
      p_ip_hash: visitorHash(req.headers),
    });
    if (error?.message === "USERNAME_TAKEN") {
      return json({ error: "Some fields need attention.", fields: { username: "That username is taken. Try another." } }, 409);
    }
    if (error?.message === "RATE_LIMITED") {
      return json({ error: "Too many accounts created from here recently. Please wait an hour and try again." }, 429);
    }
    if (error) throw new Error(error.message);

    const res = json({ status: "pending" }, 201);
    res.cookies.set(await createSession(id as string));
    return res;
  } catch (err) {
    console.error("signup failed:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
