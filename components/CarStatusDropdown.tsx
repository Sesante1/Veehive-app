import { useState } from "react";
import { View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type DropdownFieldProps = {
  items: { label: string; value: string }[];
  placeholder?: string;
  value?: string | null;
  onChangeValue?: (value: string | null) => void;
  containerStyle?: string;
};

const DropdownField = ({
  items,
  placeholder = "Select",
  value,
  onChangeValue,
  containerStyle,
}: DropdownFieldProps) => {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? null);
  const [localItems, setLocalItems] = useState(items);

  return (
    <View
      className={`my-2 w-auto ${containerStyle}`} 
      style={{ zIndex: 10, alignSelf: "flex-start" }} 
    >
      <DropDownPicker
        open={open}
        value={localValue}
        items={localItems}
        setOpen={setOpen}
        setValue={(callback) => {
          const newValue = callback(localValue as string | null);
          setLocalValue(newValue);
          onChangeValue?.(newValue);
        }}
        setItems={setLocalItems}
        placeholder={placeholder}
        listMode="SCROLLVIEW"
        style={{
          borderColor: "#E5E7EB",
          borderRadius: 12,
          backgroundColor: "#F6F8FA",
          minWidth: 150, 
        }}
        dropDownContainerStyle={{
          borderColor: "#E5E7EB",
          borderRadius: 12,
          backgroundColor: "white",
          width: 150, 
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
