import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React from "react";
import { Platform } from "react-native";

interface Props {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const TimePickerModal = ({ visible, value, onClose, onConfirm }: Props) => {
  if (!visible) return null;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Android: close when user confirms; iOS spinner: update value without auto-closing
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        onConfirm(selectedDate);
      }
      onClose();
      return;
    }
    // iOS spinner
    if (selectedDate) {
      onConfirm(selectedDate);
    }
    // Let parent render a Done/Close control to call onClose()
  };

  return (
    <DateTimePicker
      value={value}
      mode="time"
      display="spinner"
      themeVariant="light"
      accentColor="#007DFC"
      onChange={handleChange}
    />
  );
};

export default TimePickerModal;
