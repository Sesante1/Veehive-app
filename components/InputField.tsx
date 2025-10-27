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

interface ExtendedInputFieldProps extends InputFieldProps {
  hasError?: boolean;
}

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  hasError = false,
  ...props
}: ExtendedInputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-4 w-full">
          <Text className={`text-1xl font-JakartaSemiBold mb-3 ${labelStyle}`}>
            {label}
            {hasError && <Text className="text-red-500"> *</Text>}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-xl ${
              hasError
                ? "border border-red-500"
                : "border border-neutral-100 focus:border-primary-500"
            } ${containerStyle}`}
          >
            {icon && (
              <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
            )}
            <TextInput
              className={`rounded-full p-4 font-JakartaMedium text-[15px] flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
