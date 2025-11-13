import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import VideoCard from "../../components/VideoCard";
import AlbumSelector from "../../components/AlbumSelector";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";
import {
  getBookmarkedPosts,
  deleteVideoPost,
  getRawBookmarks,
  deleteBookmark,
  subscribeToUserBookmarks,
} from "../../lib/appwrite";
import { getAlbums, deleteAlbum, updateAlbum, getAlbumBookmarkCounts } from "../../lib/albums";

const Bookmark = () => {
  const { user } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [rawBookmarks, setRawBookmarks] = useState([]);
  const [cleaning, setCleaning] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(undefined); // undefined = all, null = unassigned, string = album ID
  const [albumCounts, setAlbumCounts] = useState({});
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [albumSelectorVisible, setAlbumSelectorVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Fetch bookmarked posts filtered by selected album
  const refetch = useCallback(async () => {
    if (!user?.$id) {
      setPosts([]);
      return;
    }
    try {
      setPostsLoading(true);
      const result = await getBookmarkedPosts(user.$id, selectedAlbum);
      setPosts(result || []);
    } catch (err) {
      console.error("Failed to fetch bookmarked posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [user?.$id, selectedAlbum]);

  // Refetch posts when selectedAlbum or user changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // fetch albums and bookmark counts
  const loadAlbumsAndCounts = useCallback(async () => {
    if (!user?.$id) return;
    try {
      setLoadingAlbums(true);
      const [userAlbums, counts] = await Promise.all([
        getAlbums(user.$id),
        getAlbumBookmarkCounts(user.$id),
      ]);
      setAlbums(userAlbums || []);
      setAlbumCounts(counts || {});
    } catch (err) {
      console.error("Failed to load albums:", err);
    } finally {
      setLoadingAlbums(false);
    }
  }, [user?.$id]);

  useEffect(() => {
    loadAlbumsAndCounts();
  }, [loadAlbumsAndCounts]);

  // fetch raw bookmark documents so we can count/hide orphans
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.$id) {
        if (mounted) setRawBookmarks([]);
        return;
      }
      try {
        const res = await getRawBookmarks(user.$id);
        if (mounted) setRawBookmarks(res || []);
      } catch (err) {
        console.warn("getRawBookmarks failed", err);
        if (mounted) setRawBookmarks([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.$id, posts]);

  // compute hidden orphan count
  const hiddenCount = Math.max(
    0,
    (Array.isArray(rawBookmarks) ? rawBookmarks.length : 0) -
      (Array.isArray(posts) ? posts.length : 0)
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        refetch();
        loadAlbumsAndCounts();
      }
    }, [user?.$id, refetch, loadAlbumsAndCounts])
  );

  // realtime: auto-refetch on bookmark/video changes for this user
  useEffect(() => {
    if (!user?.$id) return;
    let t = null;
    const unsub = subscribeToUserBookmarks(user.$id, () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        refetch();
        loadAlbumsAndCounts();
      }, 250);
    });
    return () => {
      if (t) clearTimeout(t);
      unsub && unsub();
    };
  }, [user?.$id, refetch, loadAlbumsAndCounts]);

  // safe delete video (with guard)
  const handleDelete = async (postId) => {
    if (!postId) {
      Alert.alert("Error", "Invalid post id");
      return;
    }
    Alert.alert("Delete Video", "Are you sure you want to delete this video?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVideoPost(postId);
            await refetch();
          } catch (err) {
            console.error("Delete failed:", err);
            Alert.alert("Error", err?.message || "Failed to delete video.");
          }
        },
      },
    ]);
  };

  // attempt to remove orphan bookmarks that belong to current user (best-effort)
  const handleCleanOrphans = async () => {
    if (!user?.$id) return;
    setCleaning(true);
    try {
      const orphans = (rawBookmarks || []).filter((b) => {
        const vid = b.video?.$id ? b.video.$id : b.video;
        const exists = (posts || []).some((p) => String(p.$id) === String(vid));
        return !exists;
      });

      let removed = 0;
      for (const bm of orphans) {
        try {
          await deleteBookmark(bm.$id);
          removed++;
        } catch (err) {
          // ignore failures (likely permission); continue
          console.warn("Failed to delete orphan bookmark:", bm.$id, err?.message || err);
        }
      }

      if (removed > 0) {
        Alert.alert("Cleanup", `Removed ${removed} orphan bookmark(s).`);
      } else {
        Alert.alert(
          "Cleanup",
          "No orphan bookmarks removed. Some bookmarks may be owned by other users and cannot be deleted from this device."
        );
      }

      await refetch();
      const res = await getRawBookmarks(user.$id);
      setRawBookmarks(res || []);
    } catch (err) {
      console.error("handleCleanOrphans error:", err);
      Alert.alert("Error", "Cleanup failed.");
    } finally {
      setCleaning(false);
    }
  };

  // Handle album deletion
  const handleDeleteAlbum = async (albumId) => {
    Alert.alert(
      "Delete Album",
      "Are you sure? Bookmarks in this album will become unassigned (not deleted).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAlbum(albumId);
              Alert.alert("Success", "Album deleted successfully");
              await loadAlbumsAndCounts();
              if (selectedAlbum === albumId) {
                setSelectedAlbum(undefined); // Reset to "All"
              }
            } catch (err) {
              console.error("Failed to delete album:", err);
              Alert.alert("Error", err.message || "Failed to delete album");
            }
          },
        },
      ]
    );
  };

  // filter and search (double-safety: ensure title exists)
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    const q = (searchQuery || "").toLowerCase();
    return posts.filter((post) => {
      const title = (post?.title || "").toString().trim();
      const desc = (post?.description || "").toString().trim();
      if (!q) return true; // show all when no query
      return (
        title.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    });
  }, [posts, searchQuery]);

  // Get display name for current filter
  const getFilterDisplayName = () => {
    if (selectedAlbum === undefined) return "All Bookmarks";
    if (selectedAlbum === null) return "Unassigned";
    const album = albums.find((a) => a.$id === selectedAlbum);
    return album ? album.name : "Unknown Album";
  };

  // Get total count for display
  const getTotalCount = () => {
    if (selectedAlbum === undefined) {
      return Object.values(albumCounts).reduce((sum, count) => sum + count, 0);
    }
    const key = selectedAlbum === null ? "unassigned" : selectedAlbum;
    return albumCounts[key] || 0;
  };

  const ListHeader = () => (
    <View className="my-4">
      {/* Header */}
      <View className="px-4 mb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-2xl font-psemibold">
            {getFilterDisplayName()}
          </Text>
          <TouchableOpacity
            onPress={() => setAlbumSelectorVisible(true)}
            className="bg-secondary rounded-lg px-4 py-2"
          >
            <Text className="text-primary font-psemibold">+ Album</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 text-sm font-pregular">
          {getTotalCount()} bookmark(s)
        </Text>
      </View>

      {/* Album Filters - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* All Bookmarks */}
        <TouchableOpacity
          onPress={() => setSelectedAlbum(undefined)}
          className={`mr-3 px-4 py-2 rounded-full ${
            selectedAlbum === undefined ? "bg-secondary" : "bg-black-100"
          }`}
        >
          <Text
            className={`font-psemibold ${
              selectedAlbum === undefined ? "text-primary" : "text-gray-100"
            }`}
          >
            All ({Object.values(albumCounts).reduce((sum, count) => sum + count, 0)})
          </Text>
        </TouchableOpacity>

        {/* Unassigned */}
        <TouchableOpacity
          onPress={() => setSelectedAlbum(null)}
          className={`mr-3 px-4 py-2 rounded-full ${
            selectedAlbum === null ? "bg-secondary" : "bg-black-100"
          }`}
        >
          <Text
            className={`font-psemibold ${
              selectedAlbum === null ? "text-primary" : "text-gray-100"
            }`}
          >
            Unassigned ({albumCounts["unassigned"] || 0})
          </Text>
        </TouchableOpacity>

        {/* User Albums */}
        {albums.map((album) => (
          <TouchableOpacity
            key={album.$id}
            onPress={() => setSelectedAlbum(album.$id)}
            onLongPress={() => handleDeleteAlbum(album.$id)}
            className={`mr-3 px-4 py-2 rounded-full ${
              selectedAlbum === album.$id ? "bg-secondary" : "bg-black-100"
            }`}
          >
            <Text
              className={`font-psemibold ${
                selectedAlbum === album.$id ? "text-primary" : "text-gray-100"
              }`}
            >
              {album.name} ({albumCounts[album.$id] || 0})
            </Text>
          </TouchableOpacity>
        ))}

        {loadingAlbums && (
          <View className="px-4 py-2 justify-center">
            <ActivityIndicator size="small" color="#FF9C01" />
          </View>
        )}
      </ScrollView>

      {/* Search */}
      <View className="px-4 mb-3">
        <SearchInput
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Orphan Warning */}
      {hiddenCount > 0 && (
        <View className="px-4 py-3 mx-4 bg-red-900/20 rounded-lg border border-red-500/30">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-300 text-sm flex-1 mr-2">
              {hiddenCount} bookmark(s) have missing videos
            </Text>
            <TouchableOpacity
              onPress={handleCleanOrphans}
              disabled={cleaning}
              className="bg-red-600 px-3 py-1.5 rounded-md"
            >
              <Text className="text-white text-xs font-psemibold">
                {cleaning ? "Cleaning..." : "Clean Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item, index) => (item?.$id ? String(item.$id) : String(index))}
        extraData={posts}
        renderItem={({ item, index }) => {
          const safeId = item?.$id ?? item?.id ?? item?.video ?? String(index);
          return (
            <VideoCard
              videos={item}
              onEdit={refetch}
              onDelete={() => handleDelete(safeId)}
              onBookmarkToggle={() => {
                refetch();
                loadAlbumsAndCounts();
              }}
            />
          );
        }}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          <EmptyState
            title={
              selectedAlbum === undefined
                ? "No Bookmarks Yet"
                : selectedAlbum === null
                ? "No Unassigned Bookmarks"
                : "This Album is Empty"
            }
            subtitle={
              selectedAlbum === undefined
                ? "Start bookmarking videos to organize them here!"
                : selectedAlbum === null
                ? "All bookmarks are organized in albums"
                : "Add bookmarks to this album from Home or Profile"
            }
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* Album Selector for Creating New Albums */}
      <AlbumSelector
        visible={albumSelectorVisible}
        onClose={() => setAlbumSelectorVisible(false)}
        onSelectAlbum={(album) => {
          setAlbumSelectorVisible(false);
          if (album) {
            // After creating, switch to that album
            setSelectedAlbum(album.$id);
          }
          loadAlbumsAndCounts();
        }}
        currentAlbumId={selectedAlbum}
      />
    </SafeAreaView>
  );
};

export default Bookmark;