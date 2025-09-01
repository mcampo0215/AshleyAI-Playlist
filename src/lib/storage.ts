type Saved = {userId: string; musicUserToken: string; playlistId?: string};

const g = globalThis as any;
export const MEM: Map<string, Saved> = g.__ASHLEY_MEM__ ?? new Map();
g.__ASHLEY_MEM__ = MEM;

export async function storeUserToken(userId: string, musicUserToken: string) {
    MEM.set(userId, {userId, musicUserToken});
}
export async function getUser(userId: string) {
    return MEM.get(userId) || null;
}
export async function setPlaylist(userId: string, playlistId: string) {
    const u = MEM.get(userId); if (!u) return;
    u.playlistId = playlistId; MEM.set(userId, u);
}