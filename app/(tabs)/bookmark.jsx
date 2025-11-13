import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

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
  const { user, videosRefreshTrigger, triggerVideosRefresh } = useGlobalContext();
  
  // Memoize callbacks to prevent unnecessary re-renders
  const getBookmarkedPostsFn = useCallback(
    (albumId) => getBookmarkedPosts(user?.$id, albumId),
    [user?.$id]
  );
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
  const [albumHeaderMenuVisible, setAlbumHeaderMenuVisible] = useState(false);
  const [albumHeaderMenuPos, setAlbumHeaderMenuPos] = useState({ top: 0, left: 0 });
  const [editAlbumVisible, setEditAlbumVisible] = useState(false);
  const [editAlbumName, setEditAlbumName] = useState("");
  const [editAlbumDesc, setEditAlbumDesc] = useState("");
  const albumMenuAnchorRef = useRef(null);
  

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

  // Refetch when global refresh trigger changes (e.g., toggled in Home/Profile)
  useEffect(() => {
    if (videosRefreshTrigger > 0) {
      refetch();
      loadAlbumsAndCounts();
    }
  }, [videosRefreshTrigger, refetch, loadAlbumsAndCounts]);

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
  // Note: We fetch ALL bookmarks here, then filter by album in filteredRawBookmarks
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
  }, [user?.$id]); // Only depend on user, not posts (posts are already filtered)

  // Filter rawBookmarks by selectedAlbum to match posts filtering
  const filteredRawBookmarks = useMemo(() => {
    if (!Array.isArray(rawBookmarks)) return [];
    if (selectedAlbum === undefined) return rawBookmarks; // All bookmarks
    
    // Normalize selectedAlbum to string for comparison
    const selectedAlbumId = selectedAlbum === null ? null : String(selectedAlbum).trim();
    
    const filtered = rawBookmarks.filter((bm) => {
      // Extract album value - handle both relation object and string
      let bmAlbumValue = null;
      if (bm.album !== undefined && bm.album !== null) {
        if (typeof bm.album === 'object') {
          // Handle relation object
          bmAlbumValue = bm.album.$id || bm.album.id || null;
        } else if (typeof bm.album === 'string') {
          bmAlbumValue = bm.album.trim();
        }
      }
      
      // Normalize bookmark album value to string
      const bmAlbumId = bmAlbumValue ? String(bmAlbumValue).trim() : null;
      
      if (selectedAlbumId === null) {
        // Should be unassigned (no album or null/empty)
        return bmAlbumId === null || bmAlbumId === "";
      } else {
        // Should match specific album ID - strict comparison
        return bmAlbumId !== null && bmAlbumId === selectedAlbumId;
      }
    });
    
    // Debug logging
    if (selectedAlbum !== undefined) {
      console.log(`🔍 Filtered rawBookmarks: selectedAlbum=${selectedAlbum} (${typeof selectedAlbum}), total=${rawBookmarks.length}, filtered=${filtered.length}`);
      if (rawBookmarks.length > 0) {
        // Log album distribution
        const albumDistribution = {};
        rawBookmarks.forEach(bm => {
          const albumId = bm.album?.$id || bm.album || 'null';
          albumDistribution[albumId] = (albumDistribution[albumId] || 0) + 1;
        });
        console.log(`🔍 Album distribution:`, albumDistribution);
      }
    }
    
    return filtered;
  }, [rawBookmarks, selectedAlbum]);

  // compute hidden orphan count - only count orphans in the selected album context
  // An orphan is a bookmark that exists but its video doesn't exist in the posts
  const hiddenCount = useMemo(() => {
    if (!Array.isArray(filteredRawBookmarks) || !Array.isArray(posts)) return 0;
    
    // Create a set of video IDs from posts for fast lookup
    const postVideoIds = new Set(posts.map(p => String(p.$id || p.id || p.video || '')).filter(id => id !== ''));
    
    // Count bookmarks that don't have a corresponding video in posts
    let orphanCount = 0;
    for (const bm of filteredRawBookmarks) {
      const vid = bm.video?.$id || bm.video?.id || bm.video;
      const videoIdStr = vid ? String(vid) : '';
      
      // If bookmark has a video ID but it's not in posts, it's an orphan
      if (videoIdStr && !postVideoIds.has(videoIdStr)) {
        orphanCount++;
      }
    }
    
    // Debug logging
    if (selectedAlbum !== undefined && orphanCount > 0) {
      console.log(`⚠️ Orphan count for album ${selectedAlbum}: ${orphanCount} (filteredBookmarks: ${filteredRawBookmarks.length}, posts: ${posts.length})`);
    }
    
    return Math.max(0, orphanCount);
  }, [filteredRawBookmarks, posts, selectedAlbum]);

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
      // Use filteredRawBookmarks to only clean orphans in the selected album context
      const orphans = (filteredRawBookmarks || []).filter((b) => {
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
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 8,
                marginRight: 8,
                borderWidth: 0.5,
                borderColor: "rgba(255, 184, 140, 0.4)",
              }}
            >
              <TouchableOpacity
                onPress={() => setAlbumSelectorVisible(true)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>+ Album</Text>
              </TouchableOpacity>
            </LinearGradient>
            <View ref={albumMenuAnchorRef} collapsable={false}>
              <TouchableOpacity
                onPress={() => {
                  if (albumMenuAnchorRef.current && albumMenuAnchorRef.current.measureInWindow) {
                    albumMenuAnchorRef.current.measureInWindow((x, y, width, height) => {
                      const screenW = Dimensions.get("window").width || 360;
                      const menuW = 200;
                      const rawLeft = (Number(x) || 0) + (Number(width) || 0) - menuW;
                      const clampedLeft = Math.min(Math.max(rawLeft, 8), screenW - menuW - 8);
                      const rawTop = (Number(y) || 0) + (Number(height) || 0) + 6;
                      const safeTop = Number.isFinite(rawTop) ? rawTop : 48;
                      const safeLeft = Number.isFinite(clampedLeft) ? clampedLeft : Math.max(screenW - menuW - 8, 8);
                      setAlbumHeaderMenuPos({ top: safeTop, left: safeLeft });
                      // preload selected album fields
                      const sel = albums.find((a) => a.$id === selectedAlbum);
                      setEditAlbumName(sel?.name || "");
                      setEditAlbumDesc(sel?.description || "");
                      setAlbumHeaderMenuVisible(true);
                    });
                  } else {
                    const screenW = Dimensions.get("window").width || 360;
                    setAlbumHeaderMenuPos({ top: 48, left: Math.max(screenW - 200 - 8, 8) });
                    setAlbumHeaderMenuVisible(true);
                  }
                }}
              >
                <Image source={icons.menu} style={{ width: 20, height: 20 }} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
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
        <LinearGradient
          colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 999, padding: 1, marginRight: 12 }}
        >
          <TouchableOpacity onPress={() => setSelectedAlbum(undefined)} activeOpacity={0.8}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: selectedAlbum === undefined ? "transparent" : "#0b1220" }}>
              <Text style={{ fontWeight: "600", color: selectedAlbum === undefined ? "#ffffff" : "#e5e7eb" }}>
                All ({Object.values(albumCounts).reduce((sum, count) => sum + count, 0)})
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Unassigned */}
        <LinearGradient
          colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 999, padding: 1, marginRight: 12 }}
        >
          <TouchableOpacity onPress={() => setSelectedAlbum(null)} activeOpacity={0.8}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: selectedAlbum === null ? "transparent" : "#0b1220" }}>
              <Text style={{ fontWeight: "600", color: selectedAlbum === null ? "#ffffff" : "#e5e7eb" }}>
                Unassigned ({albumCounts["unassigned"] || 0})
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* User Albums */}
        {albums.map((album) => (
          <LinearGradient
            key={album.$id}
            colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 999, padding: 1, marginRight: 12 }}
          >
            <TouchableOpacity onPress={() => setSelectedAlbum(album.$id)} activeOpacity={0.8}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: selectedAlbum === album.$id ? "transparent" : "#0b1220" }}>
                <Text style={{ fontWeight: "600", color: selectedAlbum === album.$id ? "#ffffff" : "#e5e7eb" }}>
                  {album.name} ({albumCounts[album.$id] || 0})
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
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
      {hiddenCount > 0 && filteredPosts.length > 0 && !postsLoading && (
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
              onEdit={() => {
                refetch();
                loadAlbumsAndCounts();
                triggerVideosRefresh();
              }}
              onDelete={() => {
                refetch();
                loadAlbumsAndCounts();
                triggerVideosRefresh();
              }}
              onBookmarkToggle={() => {
                refetch();
                loadAlbumsAndCounts();
                triggerVideosRefresh();
              }}
              initialBookmarked={true}
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
          refetch();
        }}
        currentAlbumId={selectedAlbum}
      />

      {/* Header album options menu */}
      <Modal transparent visible={albumHeaderMenuVisible} animationType="fade" onRequestClose={() => setAlbumHeaderMenuVisible(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAlbumHeaderMenuVisible(false)}>
          <View style={{ position: "absolute", top: Number.isFinite(albumHeaderMenuPos.top) ? albumHeaderMenuPos.top : 48, left: Number.isFinite(albumHeaderMenuPos.left) ? albumHeaderMenuPos.left : Math.max((Dimensions.get("window").width || 360) - 200 - 8, 8), backgroundColor: "#1a2332", borderRadius: 12, borderWidth: 1, borderColor: "#FF9C01", padding: 0, width: 220, shadowColor: "#FF9C01", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            {selectedAlbum && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setAlbumHeaderMenuVisible(false);
                    const sel = albums.find((a) => a.$id === selectedAlbum);
                    setEditAlbumName(sel?.name || "");
                    setEditAlbumDesc(sel?.description || "");
                    setEditAlbumVisible(true);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#2a3a4a" }}
                >
                  <Text style={{ color: "#FF9C01", fontSize: 14, fontWeight: "600" }}>✏️ Edit Album</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setAlbumHeaderMenuVisible(false);
                    Alert.alert("Delete Album", "Are you sure?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await deleteAlbum(selectedAlbum);
                            setSelectedAlbum(undefined);
                            await loadAlbumsAndCounts();
                            await refetch();
                          } catch (e) {
                            Alert.alert("Error", e?.message || "Failed to delete album");
                          }
                        },
                      },
                    ]);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 16 }}
                >
                  <Text style={{ color: "#ff6b6b", fontSize: 14, fontWeight: "600" }}>🗑️ Delete Album</Text>
                </TouchableOpacity>
              </>
            )}
            {!selectedAlbum && (
              <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>Select an album to manage</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit selected album modal */}
      <Modal transparent visible={editAlbumVisible} animationType="slide" onRequestClose={() => setEditAlbumVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#0f172a", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#FF9C01", shadowColor: "#FF9C01", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>📁 Edit Album</Text>
            <TextInput
              value={editAlbumName}
              onChangeText={setEditAlbumName}
              placeholder="Album Name"
              placeholderTextColor="#7b7b8b"
              style={{ backgroundColor: "#1a2332", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: "#FF9C01" }}
            />
            <TextInput
              value={editAlbumDesc}
              onChangeText={setEditAlbumDesc}
              placeholder="Description (optional)"
              placeholderTextColor="#7b7b8b"
              style={{ backgroundColor: "#1a2332", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", marginBottom: 16, borderWidth: 1, borderColor: "#FF9C01", minHeight: 80 }}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity onPress={() => setEditAlbumVisible(false)} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#2a3a4a", borderRadius: 10 }}>
                <Text style={{ color: "#e0e0e0", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    if (!selectedAlbum) return;
                    await updateAlbum(selectedAlbum, { name: editAlbumName, description: editAlbumDesc });
                    setEditAlbumVisible(false);
                    await loadAlbumsAndCounts();
                  } catch (e) {
                    Alert.alert("Error", e?.message || "Failed to update album");
                  }
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FF9C01", borderRadius: 10 }}
              >
                <Text style={{ color: "#0f172a", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Bookmark;