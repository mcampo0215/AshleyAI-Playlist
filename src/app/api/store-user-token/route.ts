import { NextRequest, NextResponse } from "next/server";
import { storeUserToken } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const{musicUserToken} = await req.json();
    if(!musicUserToken) {
        return NextResponse.json({error: "Missing tokne"}, {status: 400});
    }
    const userId = "demo-user-123";
    await storeUserToken(userId, musicUserToken);
    return NextResponse.json({ok: true});
}