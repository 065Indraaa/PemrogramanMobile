import { View, Text, Image, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from "react-native";
import React, { useEffect, useRef, useState } from "react";
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

const VideoCard = ({ videos, onEdit, onDelete, onBookmarkToggle }) => {
  const title = videos?.title ?? "";
  const thumbnail = videos?.thumbnail ?? "";
  const video = videos?.video ?? "";
  const creator = videos?.creator;
  const description = videos?.description ?? "";
  const username =
    creator && typeof creator === "object" ? creator.username ?? "" : "";
  const avatar =
    creator && typeof creator === "object" ? creator.avatar ?? "" : "";
  const [play, setPlay] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [albumSelectorVisible, setAlbumSelectorVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const { user } = useGlobalContext();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const menuAnchorRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.$id) return;
        const list = await getRawBookmarks(user.$id);
        const vidId = String(videos?.$id ?? videos?.id ?? "");
        if (!vidId) return;
        const exists = Array.isArray(list) && list.some((b) => String(b.video) === vidId);
        if (mounted) setIsBookmarked(!!exists);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [user?.$id, videos?.$id]);
  //console.log(thumbnail);
  const avatarSource = avatar ? { uri: avatar } : images.profile;
  const thumbSource = thumbnail ? { uri: thumbnail } : images.thumbnail;

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
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center"
          activeOpacity={0.5}
          onPress={() => {
            if (video) setPlay(true);
            else Alert.alert("Unavailable", "Video URL is missing.");
          }}
        >
          <Image
            source={thumbSource}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
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
          <View style={{ position: "absolute", top: Number.isFinite(menuPos.top) ? menuPos.top : 48, left: Number.isFinite(menuPos.left) ? menuPos.left : Math.max((Dimensions.get("window").width || 360) - 180 - 8, 8), backgroundColor: "#0b1220", borderRadius: 8, borderWidth: 1, borderColor: "#334155", padding: 8, width: 180 }}>
            <TouchableOpacity
              className="py-2"
              onPress={async () => {
                setMenuVisible(false);
                try {
                  if (!user?.$id) return;
                  const vidId = videos.$id ?? videos.id;
                  if (isBookmarked) {
                    await deleteBookmarkByVideo(user.$id, vidId);
                    setIsBookmarked(false);
                    onBookmarkToggle && onBookmarkToggle();
                    Alert.alert("Removed", "Removed from bookmarks.");
                  } else {
                    setAlbumSelectorVisible(true);
                  }
                } catch (e) {
                  Alert.alert("Error", e?.message || "Failed to toggle bookmark.");
                }
              }}
            >
              <Text className="text-white">{isBookmarked ? "Unbookmark" : "Bookmark"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2"
              onPress={() => {
                setMenuVisible(false);
                setEditTitle(title);
                setEditDescription(description);
                setEditVisible(true);
              }}
            >
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2"
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
              <Text className="text-red-500">Delete</Text>
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
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to bookmark.");
          }
        }}
      />

      <Modal transparent visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View className="flex-1 justify-center px-6 bg-black/50">
          <View className="bg-primary rounded-2xl p-4">
            <Text className="text-white text-lg font-psemibold mb-3">Edit Video</Text>
            <TextInput
              className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-3"
              placeholder="Title"
              placeholderTextColor="#7b7b8b"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-4"
              placeholder="Description"
              placeholderTextColor="#7b7b8b"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <View className="flex-row justify-end">
              <TouchableOpacity className="px-4 py-2 mr-2 bg-gray-700 rounded-lg" onPress={() => setEditVisible(false)}>
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 bg-secondary rounded-lg"
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
                <Text className="text-primary font-psemibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VideoCard;
