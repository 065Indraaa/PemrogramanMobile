import { TouchableOpacity, Text } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const CustomButton = ({
  title,
  handlePress,
  containerStyle,
  textStyle,
  isLoading,
}) => {
  return (
    <LinearGradient
      colors={["#A78BFA", "#C9A0DC", "#E8B4CE", "#FFB88C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
        minHeight: 56,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 0.5,
        borderColor: "rgba(255, 184, 140, 0.4)",
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={{
          borderRadius: 12,
          minHeight: 56,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          opacity: isLoading ? 0.5 : 1,
        }}
        disabled={isLoading}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 18 }}>
          {isLoading ? "Processing..." : title}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default CustomButton;
