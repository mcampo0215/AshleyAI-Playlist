/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Disc3, RefreshCw, Waves, Music2, Headphones, Radio, Pause, Activity, Play, ShieldCheck, } from "lucide-react";
import { loadWeeklyPlaylist, type WeeklyPlaylist } from "@/lib/playlist";
import ThemeToggle from "@/components/theme-toggle";
declare const MusicKit: any;
type ConnectStatus = "idle" | "loading" | "done" | "error";
const playlistPreview = Array.from({ length: 5 }, (_, index) => ({
    id: `placeholder-${index}`, title: `Your track ${String(index + 1).padStart(2, "0")}`, artist: "Artist name",
}));
function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}
function loadMusicKit(): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.getElementById("musickit-sdk") as HTMLScriptElement | null;
        if (existing) {
            if ((window as Window & {
                MusicKit?: unknown;
            }).MusicKit) {
                resolve();
                return;
            }
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("MusicKit failed to load.")), {
                once: true,
            });
            return;
        }
        const script = document.createElement("script");
        script.id = "musickit-sdk";
        script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("MusicKit failed to load."));
        document.body.appendChild(script);
    });
}
export default function AppleMusicShowcase({ compact = false, }: {
    compact?: boolean;
}) {
    const [playlist, setPlaylist] = useState<WeeklyPlaylist | null>(null);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [playlistError, setPlaylistError] = useState("");
    const [animated, setAnimated] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<number | null>(null);
    const [status, setStatus] = useState<ConnectStatus>("idle");
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    const [developerToken, setDeveloperToken] = useState("");
    const [musicKitReady, setMusicKitReady] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function primeConnectFlow() {
            try {
                const [devRes] = await Promise.all([
                    fetch("/api/dev-token", { cache: "no-store" }),
                    loadMusicKit(),
                ]);
                const { token } = await devRes.json();
                if (!devRes.ok || !token)
                    throw new Error("Apple Music is unavailable. Please try connecting again.");
                if (!cancelled) {
                    setDeveloperToken(token);
                    setMusicKitReady(true);
                }
            }
            catch (err: any) {
                if (!cancelled) {
                    setError(err?.message || "Apple Music setup failed to load.");
                }
            }
        }
        primeConnectFlow();
        return () => {
            cancelled = true;
        };
    }, []);
    async function updatePlaylist() {
        setPlaylistLoading(true);
        setPlaylistError("");
        try {
            const music = MusicKit.getInstance();
            setPlaylist(await loadWeeklyPlaylist(path => music.api.music(path)));
        } catch {
            setPlaylistError("We couldn't load your playlist. Please try again.");
        } finally {
            setPlaylistLoading(false);
        }
    }
    async function connect() {
        try {
            setStatus("loading");
            setError("");
            let activeToken = developerToken;
            if (!musicKitReady || !activeToken) {
                await loadMusicKit();
                const devRes = await fetch("/api/dev-token", { cache: "no-store" });
                const data = await devRes.json();
                if (!devRes.ok || !data.token)
                    throw new Error("Apple Music is unavailable. Please try connecting again.");
                activeToken = data.token;
                setDeveloperToken(activeToken);
                setMusicKitReady(true);
            }
            await MusicKit.configure({
                developerToken: activeToken,
                app: { name: "AshleyAI", build: "2.0" },
            });
            const musicUserToken = await MusicKit.getInstance().authorize();
            const save = await fetch("/api/store-user-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ musicUserToken }),
            });
            if (!save.ok) {
                throw new Error("We couldn't save your Apple Music session.");
            }
            setStatus("done");
            await updatePlaylist();
        }
        catch (err: any) {
            setError(err?.message || "Something went wrong while connecting Apple Music.");
            setStatus("error");
        }
    }
    async function refreshPlaylist() {
        try {
            setRefreshing(true);
            setMessage("");
            const res = await fetch("/api/weekly-refresh", {
                method: "GET",
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Refresh failed. Connect your Apple Music account first.");
            }
            setLastRefresh(data.added);
            setMessage(`Playlist updated with ${data.added} new track(s).`);
            await updatePlaylist();
        }
        catch (err: any) {
            setMessage(err?.message || "Refresh failed.");
        }
        finally {
            setRefreshing(false);
        }
    }
    const connected = status === "done";
    const visibleTracks = connected ? (playlist?.tracks ?? []).slice(0, 5) : playlistPreview;
    const statusLabel = status === "loading" ? "Connecting…" : connected
        ? "Apple Music connected" : status === "error" ? "Try connecting again" : "Connect Apple Music";
    return (<main className={cn("studio", !animated && "motion-paused")}>
      <div className="page-frame">
        <header className="topbar">
          <Link href="/" className="brand" aria-label="AshleyAI home">
            <span className="brand-icon"><Waves size={23}/></span>
            <span>ashley<span className="brand-ai">ai</span><span className="brand-dot">.</span></span>
          </Link>
          <nav aria-label="Main navigation">
            <Link className={!compact ? "nav-link active" : "nav-link"} href="/">Your studio</Link>
          </nav>
          <div className="topbar-actions"><span className="service-label"><Music2 size={15}/> Made for Apple Music</span><ThemeToggle /></div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot"/> YOUR TASTE. ON REPEAT.</div>
            <h1 id="hero-title">{compact ? <>Good music.<br />One <span className="highlight">connection.</span></> : <>Same you.<br /><span className="highlight">Fresh rotation.</span></>}</h1>
            <p className="hero-description">{compact ? "Bring your listening history into the mix. Connect Apple Music and give your recent favorites a place to land." : "Turn your recent listens into your next favorite mix. A little less searching. A lot more listening."}</p>
            <button type="button" onClick={connect} disabled={status === "loading" || connected} className="primary-cta">
              {connected ? <CheckCircle2 size={19}/> : <Music2 size={19}/>} {statusLabel} {!connected && <ArrowUpRight size={19}/>}
            </button>
            <p className="connection-hint"><ShieldCheck size={14}/> {connected ? "You're connected. Your next mix is ready to make." : "Secure connection through Apple Music"}</p>
            <div className="hero-tags"><span><Headphones size={14}/> Built around your listening</span><span><RefreshCw size={14}/> Ready for a refresh</span></div>
          </div>

          <div className="record-scene" aria-label="Animated vinyl record illustration">
            <div className="scene-spectrum" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <span key={index} style={{ "--bar-height": `${12 + ((index * 17) % 43)}px`, "--bar-delay": `${index * -0.13}s`, "--bar-duration": `${0.7 + (index % 5) * 0.16}s` } as CSSProperties}/>)}</div>
            <Music2 className="floating-music-note note-one" size={22} aria-hidden="true"/>
            <Music2 className="floating-music-note note-two" size={16} aria-hidden="true"/>
            <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
            <span className="scene-caption">A NEW SPIN ON YOUR FAVORITES</span>
            <div className="record-sleeve"><span>THE WEEKLY<br />ROTATION</span><Waves size={70} strokeWidth={1}/><small>CURATED BY YOUR LISTENING</small></div>
            <div className="vinyl"><div className="vinyl-label"><span>ASHLEY AI</span><Waves size={32}/><small>SIDE A · WEEKLY MIX</small></div></div>
            <div className="floating-note"><span className="equalizer" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ animationDelay: `${i * -0.19}s` }}/>)}</span><div><strong>Your listening, remixed.</strong><span>A mix that feels like you</span></div><span className="note-dot"/></div>
            <button className="animation-toggle" type="button" onClick={() => setAnimated(!animated)} aria-label={animated ? "Pause visual animations" : "Resume visual animations"} aria-pressed={!animated}>{animated ? <Pause size={13}/> : <Play size={13}/>} {animated ? "Pause motion" : "Resume motion"}</button>
            <span className="record-edition">VOL. 01 / IN YOUR ELEMENT</span>
          </div>
        </section>

        <div aria-live="polite" aria-atomic="true">{(error || message) && <div className="feedback-panel"><Activity size={18}/><div>{error && <p>{error}</p>}{message && <p>{message}</p>}</div>{error && <button type="button" onClick={() => setError("")} aria-label="Dismiss connection message">Dismiss</button>}</div>}</div>
        <div className="section-heading"><div><span className="eyebrow">THE LISTENING ROOM</span><h2>{compact ? "Make yourself at home." : "Your next rotation starts here."}</h2></div><span className="small-note"><Disc3 size={15}/> A little ritual. A better soundtrack.</span></div>
        <section className="workspace" aria-label="Playlist workspace">
          <div className="mix-panel" aria-busy={playlistLoading}>
            <div className="panel-heading"><span className="panel-label"><Music2 size={16}/> THE WEEKLY MIX</span><span className="preview-badge">{connected ? "Your playlist" : "Playlist preview"}</span></div>
            <div className="mix-intro"><div className="mix-cover"><Waves size={36}/><span>YOUR<br />MIX.</span><small>THE WEEKLY ROTATION</small></div><div><span className="overline">{connected ? "FROM YOUR APPLE MUSIC" : "A SPACE FOR YOUR FAVORITES"}</span><h3>{playlist?.name || "Your Weekly Rotation"}</h3><p>{connected ? "Your songs. Your rotation." : "Your soundtrack goes here."}</p><span className="mix-meta">{connected ? playlistLoading ? "Loading your playlist…" : playlistError ? "Playlist unavailable" : `Showing ${visibleTracks.length} of ${playlist?.tracks.length ?? 0} tracks` : "Connect Apple Music to see your songs"}</span></div></div>
            <div className="track-list" aria-label={connected ? "Your playlist tracks" : "Placeholder playlist tracks"}>
              {!playlistLoading && !playlistError && visibleTracks.map((track, index) => <div className="track" style={{ "--track-delay": `${index * 75}ms` } as CSSProperties} key={`${track.id}-${index}`}><span className="track-number">{String(index + 1).padStart(2, "0")}</span><div className={`track-art art-${index % 6}`} aria-hidden="true"><Disc3 size={22} strokeWidth={1}/></div><div className="track-copy"><strong>{track.title}</strong><span>{track.artist}</span></div><span className="track-type">{connected ? "IN YOUR MIX" : "YOUR NEXT FAVORITE"}</span><Music2 size={15} className="track-note" aria-hidden="true"/></div>)}
              <div aria-live="polite">
                {playlistLoading && <p className="playlist-state"><RefreshCw size={17} className="animate-spin"/> Loading your Apple Music tracks…</p>}
                {!playlistLoading && playlistError && <div className="playlist-state"><p>{playlistError}</p><button type="button" onClick={updatePlaylist}>Try again</button></div>}
                {connected && !playlistLoading && !playlistError && !visibleTracks.length && <p className="playlist-state">{playlist ? "Your weekly mix is empty. Refresh it to add songs from your recent listening." : "Your weekly mix is waiting to happen. Tap Refresh weekly mix to create it in Apple Music."}</p>}
              </div>
            </div>
            <div className="preview-footnote"><Headphones size={14}/> {connected ? "A five-song preview. Listen to the full mix in Apple Music." : "Placeholder songs for now. Your actual playlist appears after you connect."}</div>
          </div>
          <aside className="studio-sidebar">
            <div className="refresh-panel"><div className="panel-heading"><span className="panel-label"><Radio size={16}/> KEEP IT FRESH</span><span className="number-tag">01 — 20</span></div><div className={cn("refresh-symbol", refreshing && "is-refreshing")}><RefreshCw size={31} strokeWidth={1.5}/></div><h3>A new week.<br />Another good mix.</h3><p>Bring up to 20 tracks from your recent listening into your AshleyAI Weekly Mix.</p><button type="button" className="refresh-cta" onClick={refreshPlaylist} disabled={refreshing || playlistLoading || !connected}><span>{refreshing ? "Refreshing your mix…" : "Refresh weekly mix"}</span><RefreshCw size={17} className={refreshing ? "animate-spin" : ""}/></button><span className="refresh-hint">{lastRefresh !== null ? `${lastRefresh} tracks added on your last refresh` : connected ? "Ready to bring your recent listens into the mix" : "Connect Apple Music before your first refresh"}</span></div>
            <div className="connection-panel"><div className="connection-icon"><Music2 size={20}/></div><div><strong>Apple Music</strong><span>{connected ? "Connected to your studio" : musicKitReady ? "Ready when you are" : "Connect to get started"}</span></div><span className={cn("connection-dot", connected && "connected")}/></div>
            <div className="how-it-works"><span className="panel-label">FROM YOUR LIBRARY, WITH LOVE</span><p><span>01</span> Connect your Apple Music account.</p><p><span>02</span> Refresh to gather your recent listens.</p><p><span>03</span> Find your weekly mix in Apple Music.</p><a href="https://music.apple.com/" target="_blank" rel="noreferrer">Open Apple Music <ArrowUpRight size={14}/></a></div>
          </aside>
        </section>

        <footer><span>ashleyai. <span className="footer-muted">Good taste deserves a good mix.</span></span><span>MADE FOR YOUR ON-REPEAT ERA <ArrowRight size={13}/></span></footer>
      </div>
    </main>);
}
