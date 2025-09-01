/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { getUser, setPlaylist } from "@/lib/storage";
import { addTracksToPlaylist, ensurePlaylist, getRecentPlayedTracks } from "@/lib/apple";

export const runtime = "nodejs";

async function signDeveloperToken() {
  const teamId = process.env.APPLE_TEAM_ID!;
  const keyId  = process.env.APPLE_MUSICKIT_KEY_ID!;
  const raw = process.env.APPLE_MUSICKIT_PRIVATE_KEY_P8 ??
              Buffer.from(process.env.APPLE_MUSICKIT_PRIVATE_KEY_P8_B64 || "", "base64").toString("utf8");
  const pem = raw.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now()/1000);
  return new SignJWT({ iss: teamId, iat: now, exp: now + 60*60 })
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(key);
}

export async function GET() {
  try {
    const userId = "demo-user-123";
    const user = await getUser(userId);
    if (!user?.musicUserToken) return NextResponse.json({ error: "User not connected" }, { status: 400 });

    const developerToken = await signDeveloperToken();
    const auth = { developerToken, musicUserToken: user.musicUserToken };

    const playlistName = "AshleyAI Weekly Mix";
    const playlistId = user.playlistId || await ensurePlaylist(auth, playlistName);
    if (!user.playlistId) await setPlaylist(userId, playlistId);

    const recent = await getRecentPlayedTracks(auth, 30);

    const picks: string[] = [];
    const seen = new Set<string>();
    for (const item of recent) {
      const id = item?.id;
      if (id && !seen.has(id)) { seen.add(id); picks.push(id); }
      if (picks.length >= 20) break;
    }

    await addTracksToPlaylist(auth, playlistId, picks);
    return NextResponse.json({ ok: true, added: picks.length, playlistId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
