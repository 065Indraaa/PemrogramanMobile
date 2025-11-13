import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/EmptyState";
import { getUserPost, signOut } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons, images } from "../../constants";
import InfoBox from "../../components/InfoBox";
import { router } from "expo-router";

const Profile = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(() => (user?.$id ? getUserPost(user.$id) : Promise.resolve([])));

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLoggedIn(false);

    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            videos={item}
            onEdit={refetch}
            onDelete={refetch}
            onBookmarkToggle={refetch}
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
            <View className="w-16 h-16 border border-secondary-100 rounded-lg justify-center items-center">
              <Image
                source={user?.avatar ? { uri: user.avatar } : images.profile}
                className="w-[90%] h-[90%] rounded-lg"
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
