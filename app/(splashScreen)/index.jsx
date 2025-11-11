import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const Index = () => {
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const initAndNavigate = async () => {
      console.log("🎬 Splash screen mounted, checking auth...");

      // Check auth status from AsyncStorage
      const result = await checkAuth();
      console.log("✅ Auth check complete, user:", !!result?.user);

      // Wait 2 seconds then navigate
      const timer = setTimeout(() => {
        console.log("⏱️ Splash timeout complete, navigating to explore...");
        router.replace("/explore");
      }, 2000);

      return () => clearTimeout(timer);
    };

    initAndNavigate();
  }, [router, checkAuth]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <View className="flex-row items-center space-x-3">
        <Image
          source={require("../../assets/images1/logo.png")}
          className="w-20 h-20"
          resizeMode="contain"
        />
        <Text className="text-4xl font-bold text-black">Tasktuges</Text>
      </View>
    </View>
  );
};

export default Index;
