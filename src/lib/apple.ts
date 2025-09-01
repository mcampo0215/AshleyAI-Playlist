export type AppleAuth = {developerToken: string; musicUserToken: string};
const API = "https://api.music.apple.com";

async function appleFetch(path: string, {auth, method = "GET", body}:
    {auth: AppleAuth; method?: string; body?: any}) {
        const r = await fetch(`${API}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${auth.developerToken}`,
                "Music-User-Token": auth.musicUserToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: body?JSON.stringify(body): undefined,
            cache: "no-store",
        });
        if(!r.ok) throw new Error(`${method} ${path} failed: ${r.status} ${await r.text()}`)
            return r.status===204?null: r.json();
    }
    export async function getRecentPlayedTracks(auth: AppleAuth, limit = 30) {
        const capped = Math.min(Math.max(limit, 1), 30);
        return (await appleFetch(`/v1/me/recent/played/tracks?limit=${limit}`, {auth}))?.data || [];
    }
    export async function ensurePlaylist(auth: AppleAuth, name: string) {
        const list = (await appleFetch(`/v1/me/library/playlists?limit=30`, {auth}))?.data || [];
        const found = list.find((p: any) => p?.attributes?.name===name);
        if(found) return found.id as string;
        const created = await appleFetch(`/v1/me/library/playlists`, {
            auth, method: "POST", body: {attributes:{name, description: "AI-refreshed weekly by AshleyAI"}}
        });
        return created?.data?.[0]?.id as string;
    }
    export async function addTracksToPlaylist(auth: AppleAuth, playlistId: string, songIds: string[]) {
        if(!songIds.length) return;
        await appleFetch(`/v1/me/library/playlists/${playlistId}/tracks`, {
            auth, method: "POST",
            body: {data: songIds.map(id => ({id, type: "songs"}))},
        });
    }
