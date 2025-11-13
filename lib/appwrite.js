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
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  videoCollectionId,
  storageId,
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

    if (!newAccount) throw Error;

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
    console.log("createUser error:", error);
    throw new Error(error);
  }
};

export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error);
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
    const post = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.search("title", query),
    ]);
    return post.documents;
  } catch (err) {
    throw new Error(err);
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
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    throw new Error(error);
  }
};

export const getBookmarkedPosts = async (userId, albumId) => {
  try {
    const uid = String(userId || "").trim();
    if (!uid) return [];
    const filtered = BOOKMARKS.filter((b) => {
      if (String(b.user) !== uid) return false;
      if (albumId === undefined) return true;
      if (albumId === null) return !b.album;
      return String(b.album || "") === String(albumId);
    });
    const idSet = new Set(filtered.map((b) => String(b.video)));
    const all = await getAllPost();
    return (all || []).filter((p) => idSet.has(String(p.$id)));
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
    return BOOKMARKS.filter((b) => String(b.user) === uid).map((b) => ({ ...b }));
  } catch (err) {
    return [];
  }
};

export const deleteBookmark = async (bookmarkId) => {
  try {
    const idx = BOOKMARKS.findIndex((b) => String(b.$id) === String(bookmarkId));
    if (idx >= 0) BOOKMARKS.splice(idx, 1);
    return true;
  } catch (err) {
    throw new Error(err?.message || String(err));
  }
};

export const subscribeToUserBookmarks = (userId, onChange) => {
  try {
    return () => {};
  } catch (err) {
    return () => {};
  }
};

export const createBookmark = async (userId, videoId, albumId = null) => {
  const uid = String(userId || "").trim();
  const vid = String(videoId || "").trim();
  if (!uid || !vid) return null;
  const existing = BOOKMARKS.find(
    (b) => String(b.user) === uid && String(b.video) === vid
  );
  if (existing) {
    existing.album = albumId ? String(albumId) : null;
    return existing;
  }
  const bm = { $id: ID.unique(), user: uid, video: vid, album: albumId ? String(albumId) : null };
  BOOKMARKS.push(bm);
  return bm;
};

export const deleteBookmarkByVideo = async (userId, videoId) => {
  const uid = String(userId || "").trim();
  const vid = String(videoId || "").trim();
  if (!uid || !vid) return false;
  const idx = BOOKMARKS.findIndex((b) => String(b.user) === uid && String(b.video) === vid);
  if (idx >= 0) BOOKMARKS.splice(idx, 1);
  return true;
};

export const deleteAllBookmarksForVideo = async (videoId) => {
  const vid = String(videoId || "").trim();
  if (!vid) return 0;
  let removed = 0;
  for (let i = BOOKMARKS.length - 1; i >= 0; i--) {
    if (String(BOOKMARKS[i].video) === vid) {
      BOOKMARKS.splice(i, 1);
      removed++;
    }
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
  if (!file) return;

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  console.log("file", file);

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    console.log("UPloaded", uploadedFile);

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    console.log(fileUrl);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  console.log(form);
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

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

    console.log(newPost);

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}
