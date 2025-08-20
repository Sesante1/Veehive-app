import { useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View, Text } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type DropdownFieldProps = {
  label: string;
  items: { label: string; value: string }[];
  placeholder?: string;
  value?: string | null;
  onChangeValue?: (value: string | null) => void;
};

const DropdownField = ({
  label,
  items,
  placeholder = "Select an option",
  value,
  onChangeValue,
}: DropdownFieldProps) => {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? null);
  const [localItems, setLocalItems] = useState(items);

  return (
      <View className="my-4 w-full">
        <Text className="text-lg font-JakartaSemiBold mb-3">
          {label}
        </Text>
        <DropDownPicker
          open={open}
          value={localValue}
          items={localItems}
          setOpen={setOpen}
          setValue={(callback) => {
            const newValue = callback(localValue);
            setLocalValue(newValue);
            onChangeValue?.(newValue);
          }}
          setItems={setLocalItems}
          placeholder={placeholder}
          listMode="SCROLLVIEW"
          style={{
            borderColor: "#F6F8FA",
            borderRadius: 12,
            backgroundColor: "#F6F8FA",
          }}
          dropDownContainerStyle={{
            borderColor: "#F6F8FA",
            borderRadius: 12,
            backgroundColor: "white",
          }}
          labelStyle={{
            fontFamily: "JakartaSemiBold",
            fontSize: 15,
          }}
        />
      </View>
  );
};

export default DropdownField;
