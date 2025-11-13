import {
  Client,
  Account,
  ID,
  Avatars,
  Databases,
  Query,
  Storage,
} from "react-native-appwrite";

const client = new Client();
export const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);
const BOOKMARKS = [];

export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.anonymous.react_native_app_one",
  projectId: "68c195230005cd1787a4",
  databaseId: "66296f08c154213bd921",
  userCollectionId: "66296f5c795d9e7023cc",
  videoCollectionId: "66296f27a547b510a517",
  storageId: "6629737f59ea45ce74c6",
  bookmarksCollectionId: "bookmarks", // Bookmarks collection
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  videoCollectionId,
  storageId,
  bookmarksCollectionId,
} = config;

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const createUser = async (email, password, username) => {
  try {
    // Buat account baru
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw new Error("Failed to create account");

    const avatarUrl = avatars.getInitials(username);

    // Sign in setelah account dibuat
    await signIn(email, password);

    // Buat dokumen di Collection 'users'
    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountid: newAccount.$id, // <--- HARUS SESUAI SCHEMA: lowercase 'accountid'
        email,
        username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    const errorMessage = error?.message || String(error) || "Unknown error occurred";
    console.error("createUser error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailSession(email, password);
    return session;
  } catch (error) {
    const errorMessage = error?.message || String(error) || "Sign in failed";
    console.error("signIn error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountid", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    return null;
  }
};

export const getAllPost = async () => {
  try {
    const post = await databases.listDocuments(databaseId, videoCollectionId);
    return post.documents;
  } catch (err) {
    throw new Error(err);
  }
};

export const getLatestVideos = async () => {
  try {
    const post = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.orderDesc("$createdAt"),
      Query.limit(7),
    ]);
    return post.documents;
  } catch (err) {
    throw new Error(err);
  }
};

export const getLatestVideosByUser = async (userId) => {
  try {
    const post = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.equal("creator", String(userId)),
      Query.orderDesc("$createdAt"),
      Query.limit(7),
    ]);
    return post.documents;
  } catch (err) {
    throw new Error(err);
  }
};

export const getSearchPost = async (query) => {
  try {
    const q = String(query || "").trim();
    if (!q) return [];
    // Try Appwrite full-text search first
    try {
      const res = await databases.listDocuments(databaseId, videoCollectionId, [
        Query.search("title", q),
      ]);
      if (Array.isArray(res?.documents) && res.documents.length > 0) {
        return res.documents;
      }
    } catch (_) {
      // ignore and fallback
    }
    // Fallback: fetch all posts and filter on client (case-insensitive)
    const all = await getAllPost();
    const filtered = (all || []).filter((p) =>
      String(p?.title || "").toLowerCase().includes(q.toLowerCase())
    );
    return filtered;
  } catch (err) {
    throw new Error(err?.message || String(err));
  }
};

export const getUserPost = async (userId) => {
  try {
    const post = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.equal("creator", userId),
    ]);
    return post.documents;
  } catch (err) {
    throw new Error(err);
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("signOut error:", error?.message || String(error));
    return true; // Return true anyway to allow logout
  }
};

export const getBookmarkedPosts = async (userId, albumId) => {
  try {
    const uid = String(userId || "").trim();
    if (!uid) return [];
    const res = await databases.listDocuments(
      databaseId,
      bookmarksCollectionId,
      [Query.equal("user", uid)]
    );
    const raw = Array.isArray(res?.documents) ? res.documents : [];
    // Filter by album on client to avoid null query issues and handle object/string album values
    const filtered = raw.filter((b) => {
      if (albumId === undefined) return true;
      const bmAlbum =
        b?.album && typeof b.album === "object"
          ? b.album.$id || b.album.id || null
          : b?.album || null;
      if (albumId === null) return !bmAlbum;
      return String(bmAlbum || "") === String(albumId);
    });
    // Collect exact video IDs (handle string or relation object just in case)
    const ids = Array.from(
      new Set(
        filtered
          .map((b) => {
            const v = b?.video;
            return v && typeof v === "object" ? v.$id || v.id : v;
          })
          .filter(Boolean)
          .map((s) => String(s))
      )
    );
    if (ids.length === 0) return [];
    // Fetch videos by ID in chunks to avoid pagination limits
    const CHUNK = 100;
    const results = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const r = await databases.listDocuments(databaseId, videoCollectionId, [
        Query.equal("$id", chunk),
        Query.limit(Math.min(chunk.length, CHUNK)),
      ]);
      if (Array.isArray(r?.documents)) results.push(...r.documents);
    }
    // Keep the same order as bookmarks (optional)
    const orderMap = new Map(ids.map((id, idx) => [String(id), idx]));
    results.sort((a, b) => (orderMap.get(String(a.$id)) ?? 0) - (orderMap.get(String(b.$id)) ?? 0));
    return results;
  } catch (err) {
    return [];
  }
};

export const deleteVideoPost = async (postId) => {
  try {
    if (!postId) return;
    await databases.deleteDocument(config.databaseId, config.videoCollectionId, String(postId));
    return true;
  } catch (err) {
    throw new Error(err?.message || String(err));
  }
};

export const getRawBookmarks = async (userId) => {
  try {
    const uid = String(userId || "").trim();
    if (!uid) return [];
    const res = await databases.listDocuments(
      databaseId,
      bookmarksCollectionId,
      [Query.equal("user", uid)]
    );
    return Array.isArray(res?.documents) ? res.documents : [];
  } catch (err) {
    return [];
  }
};

export const deleteBookmark = async (bookmarkId) => {
  try {
    await databases.deleteDocument(databaseId, bookmarksCollectionId, String(bookmarkId));
    return true;
  } catch (err) {
    throw new Error(err?.message || String(err));
  }
};

export const subscribeToUserBookmarks = (userId, onChange) => {
  try {
    const uid = String(userId || "").trim();
    if (!uid) return () => {};
    const channel = `databases.${databaseId}.collections.${bookmarksCollectionId}.documents`;
    const unsubscribe = client.subscribe(channel, (resp) => {
      try {
        const doc = resp?.payload;
        const events = resp?.events || [];
        const isDocEvent = events.some((e) => e.includes(".documents."));
        if (!isDocEvent || !doc) return;
        const docUser = typeof doc.user === "object" ? doc.user.$id || doc.user.id : doc.user;
        if (String(docUser || "") === uid) {
          onChange && onChange(resp);
        }
      } catch (_) {}
    });
    return () => {
      try { unsubscribe && unsubscribe(); } catch (_) {}
    };
  } catch (err) {
    return () => {};
  }
};

export const createBookmark = async (userId, videoId, albumId = null) => {
  const uid = String(userId || "").trim();
  const vid = String(videoId || "").trim();
  if (!uid || !vid) return null;
  // Check existing
  const existingRes = await databases.listDocuments(
    databaseId,
    bookmarksCollectionId,
    [Query.equal("user", uid), Query.equal("video", vid)]
  );
  const existing = existingRes?.documents?.[0];
  if (existing) {
    const updated = await databases.updateDocument(
      databaseId,
      bookmarksCollectionId,
      existing.$id,
      { album: albumId ? String(albumId) : null }
    );
    return updated;
  }
  const created = await databases.createDocument(
    databaseId,
    bookmarksCollectionId,
    ID.unique(),
    { user: uid, video: vid, album: albumId ? String(albumId) : null }
  );
  return created;
};

export const deleteBookmarkByVideo = async (userId, videoId) => {
  const uid = String(userId || "").trim();
  const vid = String(videoId || "").trim();
  if (!uid || !vid) return false;
  const res = await databases.listDocuments(
    databaseId,
    bookmarksCollectionId,
    [Query.equal("user", uid), Query.equal("video", vid)]
  );
  const docs = Array.isArray(res?.documents) ? res.documents : [];
  for (const d of docs) {
    await databases.deleteDocument(databaseId, bookmarksCollectionId, d.$id);
  }
  return true;
};

export const deleteAllBookmarksForVideo = async (videoId) => {
  const vid = String(videoId || "").trim();
  if (!vid) return 0;
  const res = await databases.listDocuments(
    databaseId,
    bookmarksCollectionId,
    [Query.equal("video", vid)]
  );
  const docs = Array.isArray(res?.documents) ? res.documents : [];
  let removed = 0;
  for (const d of docs) {
    await databases.deleteDocument(databaseId, bookmarksCollectionId, d.$id);
    removed++;
  }
  return removed;
};

export const updateVideoPost = async (postId, updates) => {
  const payload = {};
  if (typeof updates?.title === "string") payload.title = updates.title;
  if (typeof updates?.description === "string") payload.description = updates.description;
  if (Object.keys(payload).length === 0) return null;
  const updated = await databases.updateDocument(
    databaseId,
    videoCollectionId,
    String(postId),
    payload
  );
  return updated;
};

export async function uploadFile(file, type) {
  if (!file) throw new Error("File is required");

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  console.log("Uploading file:", asset.name);

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    console.log("File uploaded successfully:", uploadedFile.$id);

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    const errorMessage = error?.message || String(error) || "File upload failed";
    console.error("uploadFile error:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getFilePreview(fileId, type) {
  if (!fileId) throw new Error("File ID is required");
  if (!type) throw new Error("File type is required");

  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(storageId, fileId);
    } else if (type === "image") {
      // Smaller preview to avoid memory issues on Android (black images)
      fileUrl = storage.getFilePreview(
        storageId,
        fileId,
        800,
        800,
        "center",
        80
      );
    } else {
      throw new Error(`Invalid file type: ${type}`);
    }

    if (!fileUrl) throw new Error("Failed to generate file preview URL");

    console.log("File preview URL generated successfully");

    return fileUrl;
  } catch (error) {
    const errorMessage = error?.message || String(error) || "Failed to get file preview";
    console.error("getFilePreview error:", errorMessage);
    throw new Error(errorMessage);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  console.log("Creating video post with form:", form);
  
  if (!form.title || !form.description || !form.thumbnail || !form.video || !form.userId) {
    throw new Error("All fields are required: title, description, thumbnail, video, userId");
  }

  try {
    console.log("Uploading thumbnail and video...");
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    console.log("Files uploaded. Creating database document...");

    const newPost = await databases.createDocument(
      databaseId,
      videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        description: form.description,
        creator: form.userId,
      }
    );

    console.log("Video post created successfully:", newPost.$id);

    return newPost;
  } catch (error) {
    const errorMessage = error?.message || String(error) || "Failed to create video post";
    console.error("createVideoPost error:", errorMessage);
    throw new Error(errorMessage);
  }
}
