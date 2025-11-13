import { View, Text, Image } from "react-native";
import React from "react";
import { Tabs, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "../../constants";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center gap-2">
      <LinearGradient
        colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 999, padding: 1 }}
      >
        <View style={{ padding: 10, borderRadius: 999, backgroundColor: focused ? "transparent" : "#0b1220" }}>
          <Image
            source={icon}
            resizeMode="contain"
            tintColor={focused ? "#fff" : color}
            className="w-5 h-5"
          />
        </View>
      </LinearGradient>
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{ color: focused ? "#ffffff" : color }}
      >
        {name}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor : "#FFB88C",
          tabBarInactiveTintColor : "#CDCDE0",
          tabBarStyle : {
            backgroundColor: "transparent",
            borderTopWidth : 0,
            height : 84
          },
          tabBarBackground: () => (
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={["#0b1220", "#0f172a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
              <LinearGradient
                colors={["#A78BFA", "#FFB88C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1 }}
              />
            </View>
          )

        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home}
                color={color}
                name="Home"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="bookmark"
          options={{
            title: "Bookmark",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.bookmark}
                color={color}
                name="Bookmark"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.plus}
                color={color}
                name="Create"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Profile"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
