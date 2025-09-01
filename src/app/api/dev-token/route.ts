import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

export const runtime = "nodejs";

export async function GET() {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_MUSICKIT_KEY_ID;

    const raw = 
        process.env.APPLE_MUSICKIT_PRIVATE_KEY_p8 ??
        Buffer.from(process.env.APPLE_MUSICKIT_PRIVATE_KEY_P8_B64 || "", "base64").toString("utf8");

    if(!teamId || !keyId || !raw) {
        return NextResponse.json(
            {error: "Missing APPLE_TEAM_ID / APPLE_MUSICKIT_KEY_ID / private key env"},
            {status:500}
        );
    }
    const pem = raw.replace(/\\n/g, "\n");
    const privateKey = await importPKCS8(pem, "ES256");

    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({iss: teamId, iat: now, exp: now + 60 * 60})
        .setProtectedHeader({alg: "ES256", kid: keyId})
        .sign(privateKey);

    return NextResponse.json({token});
}