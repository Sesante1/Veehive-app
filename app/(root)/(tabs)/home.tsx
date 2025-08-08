import InputField from "@/components/InputField";
import React from "react";
import { Text, View } from "react-native";
import { useState } from "react";

import { icons } from "@/constants";

const Home = () => {
  const [search, setSearch] = useState("");

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-JakartaMedium mt-6">
        Explore new {"\n"}Desitinations with ease!
      </Text>

      <InputField
        label=""
        placeholder="Search cars"
        icon={icons.search}
        textContentType="emailAddress"
        value={search}
        onChangeText={setSearch}
      />
    </View>
  );
};

export default Home;
