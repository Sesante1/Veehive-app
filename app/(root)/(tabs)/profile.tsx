import React from "react";
import { Image, ScrollView, Text, View } from "react-native";

const Profile = () => {
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="p-4"
        // contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-2xl font-JakartaBold">Account</Text>

        <View className="flex items-center justify-center my-5">
          <Image
            // source={{
            //   uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            // }}
            source={require("../../../assets/images/person1.jpg")}
            style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
            className=" rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
          />

          <Text className="mt-5 font-JakartaSemiBold">Jhon Doe</Text>
          <Text className="font-Jakarta">Guest</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
