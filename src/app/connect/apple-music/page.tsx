/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState } from "react"

declare const MusicKit: any;

export default function ConnectAppleMusic() {
    const[status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle");
    const[err, setErr] = useState("");

    useEffect(() => {
        if(document.getElementById("musickit-sdk")) return;
        const s = document.createElement("script");
        s.id = "musickit-sdk";
        s.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
        s.async = true;
        document.body.appendChild(s);
    }, []);

    async function connect() {
        try {
            setStatus("loading");
            const devRes = await fetch("/api/dev-token", {cache: "no-store"});
            const{token: developerToken} = await devRes.json();

            await MusicKit.configure({
                developerToken,
                app: {name: "AshleyAI", build: "1.0"},
            });

            const musicUserToken = await MusicKit.getInstance().authorize();
            const save = await fetch("/api/store-user-token", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({musicUserToken}),
            });
            if(!save.ok) throw new Error("store-user-token failed");

            setStatus("done");
        } catch(e: any) {
            setErr(e?.message || "Unknown error");
            setStatus("error");
        }
    }
    return (
    <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full space-y-4">
            <h1 className="text-2xl font-semibold">Connect Apple Music Account</h1>
            <p className="text-white/70 text-sm">Authorize once so we can update your playlist weekly.</p>
            <button
            onClick={connect}
            disabled={status==="loading"}
            className="w-full rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/20 transition">
                {status==="idle" && "Connect"}
                {status==="loading" && "Connecting..."}
                {status==="done" && "Connected"}
                {status==="error" && "Retry"}
            </button>
            {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
    </main>
    )
}
