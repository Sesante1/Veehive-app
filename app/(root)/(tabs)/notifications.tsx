import { View, Text, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'

import { images } from "@/constants";

const Notifications = () => {
  return (
    // <View className='flex-1 bg-white p-4'>
    //   <Text className="text-2xl font-JakartaBold">Notifications</Text>
    // </View>
    <SafeAreaView className="flex-1 bg-white p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text className="text-2xl font-JakartaBold">Notifications</Text>
        <View className="flex-1 h-fit flex justify-center items-center">
          <Image
            source={images.message}
            alt="message"
            className="w-full h-40"
            resizeMode="contain"
          />
          <Text className="text-3xl font-JakartaBold mt-3">
            No Notifications yet
          </Text>
          <Text className="text-base mt-2 text-center px-7">
            No notifications in your inbox, yet!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Notifications