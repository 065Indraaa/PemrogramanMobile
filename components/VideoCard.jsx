import { View, Text, Image, TouchableOpacity, Modal, TextInput, Alert, Dimensions, ActivityIndicator } from "react-native";
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { icons, images } from "../constants";
import { ResizeMode, Video } from "expo-av";
import AlbumSelector from "./AlbumSelector";
import { useGlobalContext } from "../context/GlobalProvider";
import {
  createBookmark,
  deleteBookmarkByVideo,
  deleteAllBookmarksForVideo,
  updateVideoPost,
  deleteVideoPost,
  getRawBookmarks,
} from "../lib/appwrite";

// Normalize Appwrite thumbnail URL: if it's a preview URL, convert to view (original) URL
const normalizePreviewUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  try {
    if (!url.includes("/preview")) return url;
    const projectMatch = url.match(/project=([^&]+)/);
    const project = projectMatch ? projectMatch[1] : "";
    const base = url.split("/preview")[0];
    const viewUrl = `${base}/view${project ? `?project=${project}` : ""}`;
    return viewUrl;
  } catch {
    return url;
  }
};

const VideoCard = memo(({ videos, onEdit, onDelete, onBookmarkToggle, initialBookmarked = false }) => {
  const title = videos?.title ?? "";
  const thumbnail = videos?.thumbnail ?? "";
  const video = videos?.video ?? "";
  const creator = videos?.creator;
  const description = videos?.description ?? "";
  const { user, triggerVideosRefresh, videosRefreshTrigger } = useGlobalContext();
  const isCreatorObj = creator && typeof creator === "object";
  const creatorId = !isCreatorObj ? String(creator || "") : String(creator.$id || creator.id || "");
  const useUserObj = !isCreatorObj && user?.$id && String(user.$id) === creatorId;
  const displayUser = isCreatorObj ? creator : (useUserObj ? user : null);
  const username = displayUser?.username ?? "";
  const avatar = displayUser?.avatar ?? "";
  const [play, setPlay] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [albumSelectorVisible, setAlbumSelectorVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [isBookmarked, setIsBookmarked] = useState(!!initialBookmarked);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbError, setThumbError] = useState(false);
  const menuAnchorRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.$id) return;
        const list = await getRawBookmarks(user.$id);
        const vidId = String(videos?.$id ?? videos?.id ?? "");
        if (!vidId) return;
        const exists = Array.isArray(list) && list.some((b) => {
          const bv = b?.video && typeof b.video === "object" ? (b.video.$id || b.video.id) : b?.video;
          return String(bv || "") === vidId;
        });
        if (mounted) setIsBookmarked(!!exists);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [user?.$id, videos?.$id, videosRefreshTrigger]);

  const avatarSource = avatar ? { uri: avatar } : images.profile;
  const normalizedThumbUrl = normalizePreviewUrl(thumbnail);
  const thumbSource = thumbError ? images.thumbnail : (normalizedThumbUrl ? { uri: normalizedThumbUrl } : images.thumbnail);

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-start flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center p-0.5">
            <Image
              source={avatarSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View className="justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="text-white font-psemibold text-sm"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {username}
            </Text>
          </View>
        </View>
        <View className="pt-2">
          <View ref={menuAnchorRef} collapsable={false}>
            <TouchableOpacity
              onPress={() => {
                if (menuAnchorRef.current && menuAnchorRef.current.measureInWindow) {
                  menuAnchorRef.current.measureInWindow((x, y, width, height) => {
                    const screenW = Dimensions.get("window").width || 360;
                    const menuW = 180;
                    const rawLeft = (Number(x) || 0) + (Number(width) || 0) - menuW;
                    const clampedLeft = Math.min(Math.max(rawLeft, 8), screenW - menuW - 8);
                    const rawTop = (Number(y) || 0) + (Number(height) || 0) + 6;
                    const safeTop = Number.isFinite(rawTop) ? rawTop : 48;
                    const safeLeft = Number.isFinite(clampedLeft) ? clampedLeft : Math.max(screenW - menuW - 8, 8);
                    setMenuPos({ top: safeTop, left: safeLeft });
                    setMenuVisible(true);
                  });
                } else {
                  const screenW = Dimensions.get("window").width || 360;
                  setMenuPos({ top: 48, left: Math.max(screenW - 180 - 8, 8) });
                  setMenuVisible(true);
                }
              }}
            >
              <Image source={icons.menu} className="w-5 h-5" resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {play ? (
        <Video
          source={{ uri: video }}
          className="w-full h-60 mt-3 rounded-xl"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center bg-black-100 overflow-hidden"
          activeOpacity={0.5}
          onPress={() => {
            if (video) setPlay(true);
            else Alert.alert("Unavailable", "Video URL is missing.");
          }}
          style={{ borderWidth: 1, borderColor: "rgba(167, 139, 250, 0.3)" }}
        >
          <Image
            source={thumbSource}
            className="w-full h-full rounded-xl"
            resizeMode="contain"
            onError={() => setThumbError(true)}
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      <View className="w-full mt-2">
        {!!description && (
          <Text className="text-gray-100 text-sm" numberOfLines={3}>{description}</Text>
        )}
      </View>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={{ position: "absolute", top: Number.isFinite(menuPos.top) ? menuPos.top : 48, left: Number.isFinite(menuPos.left) ? menuPos.left : Math.max((Dimensions.get("window").width || 360) - 180 - 8, 8), backgroundColor: "#1a2332", borderRadius: 12, borderWidth: 1, borderColor: "#FF9C01", padding: 0, width: 200, shadowColor: "#FF9C01", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <TouchableOpacity
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#2a3a4a" }}
              onPress={async () => {
                setMenuVisible(false);
                try {
                  if (!user?.$id) return;
                  const vidId = videos.$id ?? videos.id;
                  if (isBookmarked) {
                    await deleteBookmarkByVideo(user.$id, vidId);
                    setIsBookmarked(false);
                    onBookmarkToggle && onBookmarkToggle();
                    if (!onBookmarkToggle) triggerVideosRefresh();
                  } else {
                    // Try to save directly to unassigned (no album)
                    try {
                      await createBookmark(user.$id, vidId, null);
                      setIsBookmarked(true);
                      onBookmarkToggle && onBookmarkToggle();
                      if (!onBookmarkToggle) triggerVideosRefresh();
                      Alert.alert("Success", "Added to bookmarks.");
                    } catch (_) {
                      // Fallback to album selector if direct save fails
                      setAlbumSelectorVisible(true);
                    }
                  }
                } catch (e) {
                  Alert.alert("Error", e?.message || "Failed to toggle bookmark.");
                }
              }}
            >
              <Text style={{ color: "#FF9C01", fontSize: 14, fontWeight: "600" }}>
                {isBookmarked ? "📌 Unbookmark" : "📌 Bookmark"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#2a3a4a" }}
              onPress={() => {
                setMenuVisible(false);
                setEditTitle(title);
                setEditDescription(description);
                setEditVisible(true);
              }}
            >
              <Text style={{ color: "#e0e0e0", fontSize: 14, fontWeight: "600" }}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              onPress={async () => {
                setMenuVisible(false);
                Alert.alert("Delete Video", "Are you sure you want to delete this video?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteVideoPost(videos.$id ?? videos.id);
                        await deleteAllBookmarksForVideo(videos.$id ?? videos.id);
                        onDelete && onDelete();
                      } catch (e) {
                        Alert.alert("Error", e?.message || "Failed to delete video.");
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={{ color: "#ff6b6b", fontSize: 14, fontWeight: "600" }}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AlbumSelector
        visible={albumSelectorVisible}
        onClose={() => setAlbumSelectorVisible(false)}
        onSelectAlbum={async (album) => {
          try {
            if (!user?.$id) return;
            const albumId = album ? album.$id : null;
            await createBookmark(user.$id, videos.$id ?? videos.id, albumId);
            onBookmarkToggle && onBookmarkToggle();
            setIsBookmarked(true);
            Alert.alert("Success", "Added to bookmarks.");
            if (!onBookmarkToggle) triggerVideosRefresh();
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to bookmark.");
          }
        }}
      />

      <Modal transparent visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View className="flex-1 justify-center px-6 bg-black/50">
          <View style={{ backgroundColor: "#0f172a", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#FF9C01", shadowColor: "#FF9C01", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>✏️ Edit Video</Text>
            <TextInput
              style={{ backgroundColor: "#1a2332", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: "#FF9C01" }}
              placeholder="Video Title"
              placeholderTextColor="#7b7b8b"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={{ backgroundColor: "#1a2332", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", marginBottom: 16, borderWidth: 1, borderColor: "#FF9C01", minHeight: 80 }}
              placeholder="Video Description"
              placeholderTextColor="#7b7b8b"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#2a3a4a", borderRadius: 10, borderWidth: 0.5, borderColor: "rgba(167, 139, 250, 0.3)" }} onPress={() => setEditVisible(false)}>
                <Text style={{ color: "#e0e0e0", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: "rgba(255, 184, 140, 0.4)", background: "linear-gradient(135deg, #A78BFA 0%, #C9A0DC 33%, #E8B4CE 66%, #FFB88C 100%)" }}
                onPress={async () => {
                  try {
                    await updateVideoPost(videos.$id ?? videos.id, { title: editTitle, description: editDescription });
                    setEditVisible(false);
                    onEdit && onEdit();
                    Alert.alert("Success", "Video updated successfully.");
                  } catch (e) {
                    Alert.alert("Error", e?.message || "Failed to update video.");
                  }
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

VideoCard.displayName = "VideoCard";

export default VideoCard;
