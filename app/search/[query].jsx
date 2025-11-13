import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import { getUserSearchPost } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useLocalSearchParams } from "expo-router";
import { useGlobalContext } from "../../context/GlobalProvider";

const Search = () => {
  const { query } = useLocalSearchParams();
  const { user } = useGlobalContext();

  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, refetch } = useAppwrite(() => user?.$id && query ? getUserSearchPost(user.$id, query) : Promise.resolve([]));

  useEffect(() => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  }, [query]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <VideoCard videos={item} />}
        ListHeaderComponent={({}) => (
          <View className="my-6 px-4">
            <Text className="text-gray-100 font-pmedium text-sm">
              Search Result
            </Text>
            <Text className="text-white font-psemibold text-2xl">{query}</Text>
            <View className="mt-6 mb-8">
              <SearchInput initialQuery={query} />
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

export default Search;
