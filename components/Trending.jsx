import { useState, useEffect, memo } from "react";
import { ResizeMode, Video } from "expo-av";
import * as Animatable from "react-native-animatable";
import { FlatList, Image, View, TouchableOpacity } from "react-native";

import { icons, images } from "../constants";

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

const zoomIn = {
  0: {
    scale: 0.9,
    opacity: 0.8,
  },
  1: {
    scale: 1,
    opacity: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
    opacity: 1,
  },
  1: {
    scale: 0.9,
    opacity: 0.8,
  },
};

const TrendingItem = ({ activeItem, item }) => {
  const [play, setPlay] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <Video
          source={{ uri: item.video }}
          className="w-52 h-72 rounded-[33px] mt-3 bg-white/10"
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
          className="relative flex justify-center items-center"
          activeOpacity={0.7}
          onPress={() => {
            if (item?.video) setPlay(true);
          }}
        >
          <View className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40 bg-black-100 justify-center items-center">
            <Image
              source={thumbError ? images.thumbnail : (item?.thumbnail ? { uri: normalizePreviewUrl(item.thumbnail) } : images.thumbnail)}
              className="w-full h-full"
              resizeMode="contain"
              onError={() => setThumbError(true)}
            />
          </View>

          <Image
            source={icons.play}
            className="w-8 h-8 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts?.[0]?.$id);

  useEffect(() => {
    setActiveItem(posts?.[0]?.$id);
  }, [posts]);

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default Trending;
