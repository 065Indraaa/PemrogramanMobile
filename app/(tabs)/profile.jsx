import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import EmptyState from "../../components/EmptyState";
import { getUserPost, signOut } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons, images } from "../../constants";
import InfoBox from "../../components/InfoBox";
import { router } from "expo-router";

const Profile = () => {
  const { user, setUser, setIsLoggedIn, videosRefreshTrigger, triggerVideosRefresh } = useGlobalContext();
  
  const getUserPostFn = useCallback(() => 
    user?.$id ? getUserPost(user.$id) : Promise.resolve([]), 
    [user?.$id]
  );
  
  const { data: posts, refetch } = useAppwrite(getUserPostFn);

  // Refetch when global trigger changes
  useEffect(() => {
    if (videosRefreshTrigger > 0) {
      refetch();
    }
  }, [videosRefreshTrigger, refetch]);

  // Auto-refetch when Profile screen becomes focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch, user?.$id])
  );

  const handleVideoChange = useCallback(() => {
    refetch();
    triggerVideosRefresh();
  }, [refetch, triggerVideosRefresh]);

  const logout = useCallback(async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setUser(null);
            setIsLoggedIn(false);
            router.replace("/sign-in");
          } catch (error) {
            console.error("Logout error:", error);
            setUser(null);
            setIsLoggedIn(false);
            router.replace("/sign-in");
          }
        },
      },
    ]);
  }, [setUser, setIsLoggedIn]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            videos={item}
            onEdit={handleVideoChange}
            onDelete={handleVideoChange}
            onBookmarkToggle={handleVideoChange}
          />
        )}
        ListHeaderComponent={({}) => (
          <View className="w-full mt-6 mb-12 px-4 justify-center items-center">
            <TouchableOpacity
              className="w-full mb-10 items-end"
              onPress={logout}
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-7 h-7"
              />
            </TouchableOpacity>
            <View className="w-20 h-20 border-2 border-secondary rounded-2xl justify-center items-center bg-black-100 shadow-lg shadow-black/50">
              <Image
                source={user?.avatar ? { uri: user.avatar } : images.profile}
                className="w-[95%] h-[95%] rounded-xl"
                resizeMode="cover"
              />
            </View>
            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="flex flex-row mt-5">
              <InfoBox
                title={Array.isArray(posts) ? posts.length : 0}
                subtitle="Video Upload"
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="No videos found for this search Query"
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Profile;
