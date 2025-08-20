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

interface TextAreaFieldProps extends InputFieldProps {
  numberOfLines?: number;
}

const TextAreaField = ({
  label,
  icon,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  numberOfLines = 5,
  className,
  ...props
}: TextAreaFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-4 w-full">
          {/* Label */}
          <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
            {label}
          </Text>

          {/* Container */}
          <View
            className={`flex flex-row justify-start items-start relative bg-neutral-100 rounded-2xl border border-neutral-100 focus:border-primary-500 ${containerStyle}`}
          >
            {/* Icon (optional) */}
            {icon && (
              <Image
                source={icon}
                className={`w-6 h-6 mt-4 ml-4 ${iconStyle}`}
              />
            )}

            {/* TextArea */}
            <TextInput
              multiline={true}
              numberOfLines={numberOfLines}
              textAlignVertical="top" // ensures text starts from the top
              className={`p-4 font-JakartaSemiBold text-[15px] flex-1 text-left ${inputStyle}`}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default TextAreaField;
