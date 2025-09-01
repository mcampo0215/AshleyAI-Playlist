"use client"
import { useState } from "react"
import { Button} from "./ui/button";
import { RefreshCw } from "lucide-react";

export default function WeeklyRefreshButton() {
    const[loading, setLoading] = useState(false);
    const[message, setMessage] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("api/weekly-refresh", {
                method: "GET",
                cache: "no-store",
            });
            const data = await res.json();
            if(!res.ok) {
                if(res.status === 400) {
                    setMessage(data?.error || "Make sure you connect Apple Music account.");
                }
                else {
                    throw new Error(data?.error || "Refresh failed.");
                }
            }
            else {
                setMessage(`Added ${data.added} track(s) to your playlist`);
            }
        }
        catch(e: any) {
            setMessage(e.message || "Something went wrong");
        }
        finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="space-y-2">
            <Button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}></RefreshCw>
                {loading ? "Refreshing..." : "Refresh Playlist"}
            </Button>
            {message && (
                <p className="text-sm text-white/80">
                    {message}{" "}
                    {message?.toLowerCase().includes("conect") && (
                        <a href="/connect/apple-music" className="underline">Connect now</a>
                    )}
                </p>
            )}
        </div>
    );
}