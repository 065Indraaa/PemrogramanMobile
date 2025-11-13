import { View, Text, FlatList, Image, RefreshControl } from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../constants";
import SearchInput from "../../components/SearchInput";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";
import { getUserPost, getLatestVideosByUser } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { user, videosRefreshTrigger, triggerVideosRefresh } = useGlobalContext();

  const getUserPostFn = useCallback(() => 
    user?.$id ? getUserPost(user.$id) : Promise.resolve([]), 
    [user?.$id]
  );
  
  const getLatestFn = useCallback(() => 
    user?.$id ? getLatestVideosByUser(user.$id) : Promise.resolve([]), 
    [user?.$id]
  );

  const { data: posts, refetch } = useAppwrite(getUserPostFn);
  const { data: latest, refetch: refetchLatest } = useAppwrite(getLatestFn);

  // Refetch when global trigger changes
  useEffect(() => {
    if (videosRefreshTrigger > 0) {
      refetch();
      refetchLatest();
    }
  }, [videosRefreshTrigger, refetch, refetchLatest]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchLatest()]);
    setRefreshing(false);
  }, [refetch, refetchLatest]);

  const handleVideoChange = useCallback(() => {
    refetch();
    refetchLatest();
    triggerVideosRefresh();
  }, [refetch, refetchLatest, triggerVideosRefresh]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            key={item.$id}
            videos={item}
            onEdit={handleVideoChange}
            onDelete={handleVideoChange}
            onBookmarkToggle={handleVideoChange}
          />
        )}
        ListHeaderComponent={({}) => (
          <View className="my-6 px-4 space-y-4">
            <View className="justify-between items-start flex-row mb-6">
              <View className="">
                <Text className="text-gray-100 font-pmedium text-sm">
                  Welcome Back
                </Text>
                <Text className="text-white font-psemibold text-2xl">
                  {user?.username}
                </Text>
              </View>
              <View className="mt-1.5">
                <Image
                  source={images.logoSmall}
                  className="w-9 h-10"
                  resizeMode="contain"
                />
              </View>
            </View>
            <SearchInput />

            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-gray-100 text-lg font-pregular mb-3">
                Latest Videos
              </Text>

              <Trending posts={latest ?? []} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="Be the first one to upload"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
