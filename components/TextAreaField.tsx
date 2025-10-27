import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { InputFieldProps } from "@/types/type";
import clsx from "clsx";
import React, { useState } from "react";

interface TextAreaFieldProps extends InputFieldProps {
  numberOfLines?: number;
  maxHeight?: number; // add maxHeight prop for flexibility
}

const TextAreaField = ({
  label,
  icon,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  numberOfLines = 20,
  maxHeight = 400, // default max height
  className,
  ...props
}: TextAreaFieldProps) => {
  const [height, setHeight] = useState(128);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={clsx("my-4 w-full", className)}>
          <Text
            className={clsx("text-lg font-JakartaSemiBold mb-3", labelStyle)}
          >
            {label}
          </Text>

          <View
            className={`flex flex-row justify-start items-start relative bg-neutral-100 rounded-2xl border border-neutral-100 focus:border-primary-500 ${containerStyle}`}
          >
            {icon && (
              <Image
                source={icon}
                className={`w-6 h-6 mt-4 ml-4 ${iconStyle}`}
              />
            )}

            <TextInput
              multiline
              onContentSizeChange={(e) =>
                setHeight(e.nativeEvent.contentSize.height)
              }
              style={{
                height: Math.min(Math.max(128, height), maxHeight),
              }}
              numberOfLines={numberOfLines}
              textAlignVertical="top"
              className={clsx(
                "p-4 font-JakartaSemiBold text-[15px] flex-1 text-left",
                inputStyle
              )}
              scrollEnabled={height >= maxHeight}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default TextAreaField;
