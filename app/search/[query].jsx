import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import { getSearchPost } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useLocalSearchParams } from "expo-router";

const Search = () => {
  const { query } = useLocalSearchParams();

  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, refetch } = useAppwrite(() => getSearchPost(query));

  useEffect(() => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  }, [query]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item, index) => (item?.$id ? String(item.$id) : String(index))}
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
