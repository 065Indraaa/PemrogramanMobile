import { ID, Permission, Role, Query } from "react-native-appwrite";
import { databases, config, account } from "./appwrite";

// Helper to resolve account ID from user profile ID
const resolveAccountId = async (userId) => {
  try {
    const userDoc = await databases.getDocument(config.databaseId, config.userCollectionId, userId);
    return userDoc.accountid || null;
  } catch {
    return null;
  }
};

// ---------------------- ALBUM MANAGEMENT ----------------------

/**
 * Create a new album for organizing bookmarks
 * @param {string} userId - User profile ID
 * @param {string} name - Album name
 * @param {string} description - Optional album description
 * @returns {object} Created album document
 */
export const createAlbum = async (userId, name, description = "") => {
  try {
    if (!userId) throw new Error("userId is required");
    if (!name || !name.trim()) throw new Error("Album name is required");

    let ownerAccountId = null;
    try {
      const currentAccount = await account.get();
      ownerAccountId = currentAccount?.$id || null;
    } catch {
      ownerAccountId = await resolveAccountId(userId).catch(() => null);
    }

    const permissions = [Permission.read(Role.any())];
    if (ownerAccountId) {
      permissions.push(Permission.read(Role.user(ownerAccountId)));
      permissions.push(Permission.update(Role.user(ownerAccountId)));
      permissions.push(Permission.delete(Role.user(ownerAccountId)));
    }

    const newAlbum = await databases.createDocument(
      config.databaseId,
      config.albumsCollectionId,
      ID.unique(),
      {
        name: name.trim(),
        description: description?.trim() || "",
        user: userId,
        isDefault: false,
      },
      permissions
    );

    console.log("📁 Created album:", newAlbum.name);
    return newAlbum;
  } catch (error) {
    console.log("createAlbum error:", error);
    throw new Error(error.message || String(error));
  }
};

/**
 * Get all albums for a user
 * @param {string} userId - User profile ID
 * @returns {array} Array of album documents
 */
export const getAlbums = async (userId) => {
  try {
    if (!userId) return [];

    const response = await databases.listDocuments(
      config.databaseId,
      config.albumsCollectionId,
      [Query.equal("user", userId), Query.orderAsc("$createdAt")]
    );

    console.log("📁 Found", response.documents.length, "albums for user:", userId);
    return response.documents || [];
  } catch (error) {
    console.log("getAlbums error:", error);
    return [];
  }
};

/**
 * Update an album's details
 * @param {string} albumId - Album document ID
 * @param {string} name - New album name
 * @param {string} description - New album description
 * @returns {object} Updated album document
 */
export const updateAlbum = async (albumId, name, description) => {
  try {
    if (!albumId) throw new Error("albumId is required");
    if (!name || !name.trim()) throw new Error("Album name is required");

    const updated = await databases.updateDocument(
      config.databaseId,
      config.albumsCollectionId,
      albumId,
      {
        name: name.trim(),
        description: description?.trim() || "",
      }
    );

    console.log("📝 Updated album:", updated.name);
    return updated;
  } catch (error) {
    console.log("updateAlbum error:", error);
    throw new Error(error.message || String(error));
  }
};

/**
 * Delete an album (bookmarks in this album will become unassigned)
 * @param {string} albumId - Album document ID
 * @returns {boolean} Success status
 */
export const deleteAlbum = async (albumId) => {
  try {
    if (!albumId) throw new Error("albumId is required");

    // First, unassign all bookmarks from this album
    try {
      const bookmarksInAlbum = await databases.listDocuments(
        config.databaseId,
        config.bookmarksCollectionId,
        [Query.equal("album", albumId)]
      );

      await Promise.all(
        bookmarksInAlbum.documents.map(async (bookmark) => {
          try {
            await databases.updateDocument(
              config.databaseId,
              config.bookmarksCollectionId,
              bookmark.$id,
              { album: null }
            );
          } catch (err) {
            console.warn("Failed to unassign bookmark:", bookmark.$id, err?.message);
          }
        })
      );
    } catch (err) {
      console.warn("Failed to unassign bookmarks (continuing with album deletion):", err?.message);
    }

    await databases.deleteDocument(config.databaseId, config.albumsCollectionId, albumId);
    console.log("🗑️ Deleted album:", albumId);
    return true;
  } catch (error) {
    console.log("deleteAlbum error:", error);
    throw new Error(error.message || String(error));
  }
};

/**
 * Move a bookmark to a specific album
 * @param {string} bookmarkId - Bookmark document ID
 * @param {string} albumId - Album document ID (or null for unassigned)
 * @returns {object} Updated bookmark document
 */
export const moveBookmarkToAlbum = async (bookmarkId, albumId) => {
  try {
    if (!bookmarkId) throw new Error("bookmarkId is required");

    const updated = await databases.updateDocument(
      config.databaseId,
      config.bookmarksCollectionId,
      bookmarkId,
      { album: albumId || null }
    );

    console.log("📌 Moved bookmark to album:", albumId || "unassigned");
    return updated;
  } catch (error) {
    console.log("moveBookmarkToAlbum error:", error);
    throw new Error(error.message || String(error));
  }
};

/**
 * Get bookmarked videos filtered by album
 * @param {string} userId - User profile ID
 * @param {string} albumId - Album document ID (null for unassigned, undefined for all)
 * @returns {array} Array of video documents with creator and bookmark info
 */
export const getBookmarksByAlbum = async (userId, albumId) => {
  try {
    if (!userId) return [];

    const queries = [Query.equal("user", userId)];
    
    // If albumId is explicitly provided (even if null), filter by it
    if (albumId !== undefined) {
      if (albumId === null) {
        // Get bookmarks with no album assigned
        queries.push(Query.isNull("album"));
      } else {
        // Get bookmarks for specific album
        queries.push(Query.equal("album", albumId));
      }
    }
    // If albumId is undefined, get all bookmarks (no album filter)

    const bookmarks = await databases.listDocuments(
      config.databaseId,
      config.bookmarksCollectionId,
      queries
    );

    console.log("📚 Found", bookmarks.documents.length, "bookmarks for album:", albumId || "all");
    return bookmarks.documents || [];
  } catch (error) {
    console.log("getBookmarksByAlbum error:", error);
    return [];
  }
};

/**
 * Get bookmark count for each album
 * @param {string} userId - User profile ID
 * @returns {object} Map of albumId -> count
 */
export const getAlbumBookmarkCounts = async (userId) => {
  try {
    if (!userId) return {};

    const bookmarks = await databases.listDocuments(
      config.databaseId,
      config.bookmarksCollectionId,
      [Query.equal("user", userId)]
    );

    const counts = {};
    for (const bm of bookmarks.documents || []) {
      const albumId = bm.album?.$id || bm.album || "unassigned";
      counts[albumId] = (counts[albumId] || 0) + 1;
    }

    return counts;
  } catch (error) {
    console.log("getAlbumBookmarkCounts error:", error);
    return {};
  }
};
