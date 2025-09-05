import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import CustomButton from "./CustomButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  pickupDate: string;
  returnDate: string;
  onApply: (pickup: string, ret: string) => void;
}

const DateRangePicker = ({
  visible,
  onClose,
  pickupDate,
  returnDate,
  onApply,
}: Props) => {
  const today = dayjs().format("YYYY-MM-DD");
  const [tempPickup, setTempPickup] = useState<string | null>(pickupDate);
  const [tempReturn, setTempReturn] = useState<string | null>(returnDate);
  const [markedDates, setMarkedDates] = useState({});

  const generatePeriod = (start: string, end: string) => {
    let period: any = {};
    let from = dayjs(start);
    let to = dayjs(end);
    for (
      let d = from;
      d.isBefore(to) || d.isSame(to, "day");
      d = d.add(1, "day")
    ) {
      const dateStr = d.format("YYYY-MM-DD");
      period[dateStr] = {
        color: "#fdd835",
        textColor: "black",
        startingDay: d.isSame(from, "day"),
        endingDay: d.isSame(to, "day"),
      };
    }
    return period;
  };

  // update markings
  useEffect(() => {
    if (tempPickup && tempReturn) {
      setMarkedDates(generatePeriod(tempPickup, tempReturn));
    } else if (tempPickup) {
      setMarkedDates({
        [tempPickup]: {
          startingDay: true,
          endingDay: true,
          color: "#fdd835",
          textColor: "black",
        },
      });
    } else {
      setMarkedDates({});
    }
  }, [tempPickup, tempReturn]);

  const handleDayPress = (day: any) => {
    const selected = day.dateString;
    if (!tempPickup || (tempPickup && tempReturn)) {
      setTempPickup(selected);
      setTempReturn(null);
    } else {
      if (dayjs(selected).isBefore(tempPickup)) {
        setTempPickup(selected);
        setTempReturn(null);
      } else {
        setTempReturn(selected);
      }
    }
  };

  const handleApply = () => {
    if (tempPickup && tempReturn) {
      onApply(tempPickup, tempReturn);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Pressable className="absolute right-3 top-6" onPress={onClose}>
            <Ionicons name="close-circle-outline" size={22} />
          </Pressable>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Select your rental dates
          </Text>
          <Calendar
            minDate={today}
            markingType="period"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            enableSwipeMonths
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 15,
              gap: 10,
            }}
          >
            <CustomButton title="Apply" onPress={handleApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DateRangePicker;
