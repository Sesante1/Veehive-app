import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React from "react";

interface Props {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const TimePickerModal = ({ visible, value, onClose, onConfirm }: Props) => {
  if (!visible) return null;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
    onClose();
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
