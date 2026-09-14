export type PlaylistTrack = { id: string; title: string; artist: string };
export type WeeklyPlaylist = { id: string; name: string; tracks: PlaylistTrack[] };
type Resource = { id: string; attributes?: { name?: string; artistName?: string } };
type Collection = { data: Resource[]; next?: string };
export type MusicRequest = (path: string) => Promise<{ data: Collection }>;

// MusicKit supplies authorization for the account connected in this browser.
export async function loadWeeklyPlaylist(request: MusicRequest): Promise<WeeklyPlaylist | null> {
  let path: string | undefined = "/v1/me/library/playlists?limit=100";
  let playlist: Resource | undefined;
  while (path) {
    const { data: page } = await request(path);
    playlist = page.data.find(item => item.attributes?.name === "AshleyAI Weekly Mix");
    if (playlist) break;
    path = page.next;
  }
  if (!playlist) return null;

  const tracks: PlaylistTrack[] = [];
  path = `/v1/me/library/playlists/${encodeURIComponent(playlist.id)}/tracks?limit=100`;
  while (path) {
    const { data: page } = await request(path);
    tracks.push(...page.data.map(track => ({
      id: track.id,
      title: track.attributes?.name || "Untitled track",
      artist: track.attributes?.artistName || "Unknown artist",
    })));
    path = page.next;
  }
  return { id: playlist.id, name: playlist.attributes?.name || "AshleyAI Weekly Mix", tracks };
}
