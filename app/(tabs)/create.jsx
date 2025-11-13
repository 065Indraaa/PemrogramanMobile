import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "../../components/FormField";
import { ResizeMode, Video } from "expo-av";
import { icons } from "../../constants";
import CustomButton from "../../components/CustomButton";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { createVideoPost } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const Create = () => {
  const { user } = useGlobalContext();
  const openPicker = async (selectType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        selectType === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (selectType === "image") {
        setForm({ ...form, thumbnail: result.assets[0] });
      }

      if (selectType === "video") {
        setForm({ ...form, video: result.assets[0] });
      }
    } else {
      setTimeout(() => {
        Alert.alert("Document Picked", JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    thumbnail: null,
    video: null,
    description: "",
  });

  const handleSubmit = async () => {
    if (!form.description || !form.title || !form.thumbnail || !form.video) {
      return Alert.alert("Please fill in all the fields");
    }
    setUploading(true);
    try {
      await createVideoPost({ ...form, userId: user.$id });
      Alert.alert("Success", "Post uploaded successfully.");
      router.push("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
      setForm({
        title: "",
        thumbnail: null,
        video: null,
        description: "",
      });
    }
  };
  return (
    <SafeAreaView className="bg-primary h-full w-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold mb-3">
          Upload Video
        </Text>
        <FormField
          title="Title"
          value={form.title}
          placeholder="Enter a catchy title"
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyle="mt-10"
        />

        <View className="mt-5 spac-y-2">
          <Text className="text-base text-gray-100 font-pmedium mb-2">
            Upload Video
          </Text>
          <TouchableOpacity onPress={() => openPicker("video")}>
            {form.video ? (
              <Video
                source={{ uri: form.video.uri }}
                className="w-full h-64 rounded-2xl"
                resizeMode={ResizeMode.COVER}
                isLooping
              />
            ) : (
              <View className="w-full h-40 rounded-2xl bg-black-100 justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 justify-center items-center">
                  <Image
                    source={icons.upload}
                    className="w-1/2 h-1/2"
                    resizeMethod="contain"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-7 spac-y-2">
          <Text className="text-base text-gray-100 font-pmedium mb-2">
            Thumbnail Image
          </Text>
          <TouchableOpacity onPress={() => openPicker("image")}>
            {form.thumbnail ? (
              <Image
                source={{ uri: form.thumbnail.uri }}
                className="w-full h-64 rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-16 rounded-2xl bg-black-200 justify-center items-center flex-row space-x-2">
                <Image
                  source={icons.upload}
                  className="w-5 h-5"
                  resizeMethod="contain"
                />
                <Text className="text-gray-100 text-sm font-pmedium">
                  Choose a file
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <FormField
          title="Description"
          value={form.description}
          placeholder="Enter a brief description"
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyle="mt-5 mb-4"
        />

        <CustomButton
          title="Submit & Publish"
          handlePress={handleSubmit}
          containerStyle="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Create;
