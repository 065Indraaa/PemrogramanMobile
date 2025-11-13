import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { icons } from "../constants";
import { Image } from "react-native";
import { getAlbums, createAlbum, updateAlbum, deleteAlbum } from "../lib/albums";
import { useGlobalContext } from "../context/GlobalProvider";

const AlbumSelector = ({ visible, onClose, onSelectAlbum, currentAlbumId = null }) => {
  const { user } = useGlobalContext();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [albumOptionsVisible, setAlbumOptionsVisible] = useState(false);
  const [selectedAlbumForOptions, setSelectedAlbumForOptions] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (visible && user?.$id) {
      loadAlbums();
    }
  }, [visible, user]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const userAlbums = await getAlbums(user.$id);
      setAlbums(userAlbums);
    } catch (error) {
      console.error("Error loading albums:", error);
      Alert.alert("Error", "Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert("Validation Error", "Album name is required");
      return;
    }

    try {
      setCreating(true);
      const newAlbum = await createAlbum(user.$id, newAlbumName, newAlbumDesc);
      setAlbums([...albums, newAlbum]);
      setNewAlbumName("");
      setNewAlbumDesc("");
      setShowCreateForm(false);
      Alert.alert("Success", "Album created successfully!");
      // Auto-select the newly created album and close
      if (onSelectAlbum) {
        onSelectAlbum(newAlbum);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating album:", error);
      Alert.alert("Error", error.message || "Failed to create album");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAlbum = (album) => {
    onSelectAlbum(album);
    onClose();
  };

  const handleNoAlbum = () => {
    onSelectAlbum(null);
    onClose();
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-primary rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-700">
            <Text className="text-white text-xl font-psemibold">
              {showCreateForm ? "Create Album" : "Select Album"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={icons.close || icons.menu}
                className="w-6 h-6"
                resizeMode="contain"
                tintColor="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="px-6 py-4">
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#FF9C01" />
                <Text className="text-gray-400 mt-3">Loading albums...</Text>
              </View>
            ) : showCreateForm ? (
              /* Create Album Form */
              <View>
                <Text className="text-gray-100 text-base font-pmedium mb-2">
                  Album Name *
                </Text>
                <TextInput
                  className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-4"
                  placeholder="Enter album name"
                  placeholderTextColor="#7b7b8b"
                  value={newAlbumName}
                  onChangeText={setNewAlbumName}
                />

                <Text className="text-gray-100 text-base font-pmedium mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-6"
                  placeholder="Enter description"
                  placeholderTextColor="#7b7b8b"
                  value={newAlbumDesc}
                  onChangeText={setNewAlbumDesc}
                  multiline
                  numberOfLines={3}
                />

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-700 rounded-xl py-3 items-center"
                    onPress={() => {
                      setShowCreateForm(false);
                      setNewAlbumName("");
                      setNewAlbumDesc("");
                    }}
                  >
                    <Text className="text-white font-psemibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-secondary rounded-xl py-3 items-center"
                    onPress={handleCreateAlbum}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="#161622" />
                    ) : (
                      <Text className="text-primary font-psemibold">Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Album List */
              <View>
                {/* No Album Option */}
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl mb-3 ${
                    currentAlbumId === null ? "bg-secondary/20 border border-secondary" : "bg-black-100"
                  }`}
                  onPress={handleNoAlbum}
                >
                  <View className="w-10 h-10 rounded-lg bg-gray-700 items-center justify-center mr-3">
                    <Image
                      source={icons.bookmark}
                      className="w-6 h-6"
                      resizeMode="contain"
                      tintColor="#fff"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-psemibold">
                      No Album (Default)
                    </Text>
                    <Text className="text-gray-400 text-sm font-pregular">
                      Save without organizing
                    </Text>
                  </View>
                  {currentAlbumId === null && (
                    <Image
                      source={icons.checkmark || icons.play}
                      className="w-5 h-5"
                      resizeMode="contain"
                      tintColor="#FF9C01"
                    />
                  )}
                </TouchableOpacity>

                {/* User Albums */}
                {albums.map((album) => (
                  <TouchableOpacity
                    key={album.$id}
                    onPress={() => handleSelectAlbum(album)}
                    className={`flex-row items-center p-4 rounded-xl mb-3 ${
                      currentAlbumId === album.$id
                        ? "bg-secondary/20 border border-secondary"
                        : "bg-black-100"
                    }`}
                  >
                    <View className="w-10 h-10 rounded-lg bg-secondary/30 items-center justify-center mr-3">
                      <Text className="text-secondary text-xl font-pbold">
                        {(album.name || "").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-psemibold">{album.name}</Text>
                      {album.description ? (
                        <Text className="text-gray-400 text-sm font-pregular" numberOfLines={1}>
                          {album.description}
                        </Text>
                      ) : null}
                    </View>
                    {currentAlbumId === album.$id && (
                      <Image
                        source={icons.checkmark || icons.play}
                        className="w-5 h-5"
                        resizeMode="contain"
                        tintColor="#FF9C01"
                      />
                    )}
                    <TouchableOpacity
                      className="ml-2 px-2 py-1"
                      onPress={() => {
                        setSelectedAlbumForOptions(album);
                        setEditName(album.name || "");
                        setEditDesc(album.description || "");
                        setAlbumOptionsVisible(true);
                      }}
                    >
                      <Image
                        source={icons.menu}
                        className="w-4 h-4"
                        resizeMode="contain"
                        tintColor="#FF9C01"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                {/* Create New Album Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-600 mt-2"
                  onPress={() => setShowCreateForm(true)}
                >
                  <Image
                    source={icons.plus}
                    className="w-5 h-5 mr-2"
                    resizeMode="contain"
                    tintColor="#FF9C01"
                  />
                  <Text className="text-secondary font-psemibold">
                    Create New Album
                  </Text>
                </TouchableOpacity>

                {albums.length === 0 && (
                  <View className="py-6 items-center">
                    <Text className="text-gray-400 text-center">
                      You don't have any albums yet.{"\n"}
                      Create one to organize your bookmarks!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    
    <Modal
      visible={albumOptionsVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setAlbumOptionsVisible(false)}
    >
      <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setAlbumOptionsVisible(false)}>
        <View className="absolute right-6 bottom-24 bg-black-100 rounded-lg p-3 border border-gray-700">
          <TouchableOpacity
            className="py-2"
            onPress={() => {
              setAlbumOptionsVisible(false);
              setEditModalVisible(true);
            }}
          >
            <Text className="text-white">Edit Album</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-2"
            onPress={async () => {
              try {
                if (!selectedAlbumForOptions?.$id) return;
                await deleteAlbum(selectedAlbumForOptions.$id);
                await loadAlbums();
                setAlbumOptionsVisible(false);
                Alert.alert("Success", "Album deleted successfully");
              } catch (e) {
                Alert.alert("Error", e?.message || "Failed to delete album");
              }
            }}
          >
            <Text className="text-red-500">Delete Album</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

    
    <Modal
      visible={editModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View className="flex-1 justify-center px-6 bg-black/50">
        <View className="bg-primary rounded-2xl p-4">
          <Text className="text-white text-lg font-psemibold mb-3">Edit Album</Text>
          <TextInput
            className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-3"
            placeholder="Album Name"
            placeholderTextColor="#7b7b8b"
            value={editName}
            onChangeText={setEditName}
          />
          <TextInput
            className="bg-black-100 rounded-xl px-4 py-3 text-white font-pregular mb-4"
            placeholder="Description (optional)"
            placeholderTextColor="#7b7b8b"
            value={editDesc}
            onChangeText={setEditDesc}
            multiline
          />
          <View className="flex-row justify-end">
            <TouchableOpacity className="px-4 py-2 mr-2 bg-gray-700 rounded-lg" onPress={() => setEditModalVisible(false)}>
              <Text className="text-white">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 bg-secondary rounded-lg"
              onPress={async () => {
                try {
                  if (!selectedAlbumForOptions?.$id) return;
                  await updateAlbum(selectedAlbumForOptions.$id, { name: editName, description: editDesc });
                  await loadAlbums();
                  setEditModalVisible(false);
                  Alert.alert("Success", "Album updated successfully");
                } catch (e) {
                  Alert.alert("Error", e?.message || "Failed to update album");
                }
              }}
            >
              <Text className="text-primary font-psemibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

export default AlbumSelector;
