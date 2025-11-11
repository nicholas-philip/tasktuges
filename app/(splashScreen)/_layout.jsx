import { Tabs } from "expo-router";
import React from "react";
import "../../global.css";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          height: 90,
        },
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: () => null, // optional: hide icon
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
