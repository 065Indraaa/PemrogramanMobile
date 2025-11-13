import { View, Text, Image } from "react-native";
import React from "react";
import { images } from "../constants";
import CustomButton from "./CustomButton";
import { router } from "expo-router";

export default function EmptyState({ title, subtitle }) {
  return (
    <View className="justify-center items-center px-4">
      <Image
        source={images.empty}
        className="w-[270px] h-[215px]"
        resizeMode="contain"
      />
      <Text className="text-white font-psemibold text-xl text-center">
        {title}
      </Text>
      <Text className="text-gray-100 font-pmedium text-sm">{subtitle}</Text>

      <CustomButton
        title="Create Video"
        containerStyle="w-full my-5"
        handlePress={() => router.push("/create")}
      />
    </View>
  );
}
