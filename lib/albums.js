import { getRawBookmarks } from "./appwrite";
const STORE = {
};

export async function getAlbums(userId) {
  if (!userId) return [];
  return STORE[userId] ? [...STORE[userId]] : [];
}

export async function createAlbum(userId, name, description = "") {
  if (!userId) throw new Error("Missing userId");
  const album = {
    $id: String(Date.now()),
    name: String(name || "Untitled").trim(),
    description: String(description || "").trim(),
  };
  STORE[userId] = STORE[userId] ? [...STORE[userId], album] : [album];
  return album;
}

export async function deleteAlbum(albumId) {
  if (!albumId) return false;
  for (const uid of Object.keys(STORE)) {
    const before = STORE[uid] || [];
    const after = before.filter((a) => String(a.$id) !== String(albumId));
    STORE[uid] = after;
  }
  return true;
}

export async function updateAlbum(albumId, updates = {}) {
  for (const uid of Object.keys(STORE)) {
    const list = STORE[uid] || [];
    const idx = list.findIndex((a) => String(a.$id) === String(albumId));
    if (idx >= 0) {
      const updated = {
        ...list[idx],
        ...updates,
        name: updates.name !== undefined ? String(updates.name).trim() : list[idx].name,
        description:
          updates.description !== undefined
            ? String(updates.description).trim()
            : list[idx].description,
      };
      list[idx] = updated;
      STORE[uid] = list;
      return updated;
    }
  }
  return null;
}

export async function getAlbumBookmarkCounts(userId) {
  const user = String(userId || "").trim();
  if (!user) return {};
  const bms = await getRawBookmarks(user);
  const counts = {};
  for (const bm of Array.isArray(bms) ? bms : []) {
    const key = bm.album ? String(bm.album) : "unassigned";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
