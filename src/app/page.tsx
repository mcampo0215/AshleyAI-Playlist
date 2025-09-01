/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { PulsatingButton } from "@/components/magicui/pulsating-button";
import { useEffect, useState } from "react";
import WeeklyRefreshButton from "@/components/WeeklyRefreshButton";


declare const MusicKit: any;
export default function Page() {
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
        } catch(e:any) {
            setErr(e?.message || "Unknown error");
            setStatus("error");
        }
    }
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="relative z-10 max-w-xl w-full space-y-4">
        <h1 className="text-white font-serif text-3xl font-semibold tracking-tight">
          AshleyAI - Weekly Playlist With Apple Music
        </h1>
        <p className="font-mono text-white/70">
        Connect your Apple Music account below to auto-generate your playlist every week!
        </p>
          <PulsatingButton 
          onClick={connect}
          disabled={status==="loading"}
          className="text-white font-serif inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/60 border border-white/10 backdrop-blur-sm transition-all duration-300">
                    Connect Apple Music Account
          </PulsatingButton>
          {err && <p className="text-sm text-red-400">{err}</p>}

          <WeeklyRefreshButton></WeeklyRefreshButton>

      </div>
    </div>
  )
}