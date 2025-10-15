import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type PhotoCategory = "exterior" | "interior" | "odometer" | "fuel";

interface PhotoItem {
  url: string;
  category: PhotoCategory;
  timestamp: number;
}

interface PhotoSection {
  title: string;
  photos: PhotoItem[];
}

const categoryIcons: Record<PhotoCategory, string> = {
  exterior: "directions-car",
  interior: "event-seat",
  odometer: "speed",
  fuel: "local-gas-station",
};

const TripPhotosReviewScreen = () => {
  const router = useRouter();
  const { bookingId, userRole } = useLocalSearchParams<{
    bookingId: string;
    userRole: "guest" | "host";
  }>();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<PhotoSection[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchTripPhotos();
  }, [bookingId]);

  const fetchTripPhotos = async () => {
    try {
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));

      if (!bookingDoc.exists()) {
        console.error("Booking not found");
        setLoading(false);
        return;
      }

      const data = bookingDoc.data();

      const parsePhotos = (photoArray: any[]): PhotoItem[] => {
        if (!photoArray || !Array.isArray(photoArray)) return [];
        return photoArray.map((item) => {
          if (typeof item === "string") {
            return JSON.parse(item);
          }
          return item;
        });
      };

      const guestCheckInPhotos = parsePhotos(data.guestCheckInPhotos || []);
      const guestCheckOutPhotos = parsePhotos(data.guestCheckOutPhotos || []);
      const hostCheckInPhotos = parsePhotos(data.hostCheckInPhotos || []);
      const hostCheckOutPhotos = parsePhotos(data.hostCheckOutPhotos || []);

      const photoSections: PhotoSection[] = [
        { title: "Guest Check-in Photos", photos: guestCheckInPhotos },
        { title: "Guest Check-out Photos", photos: guestCheckOutPhotos },
        { title: "Host Check-in Photos", photos: hostCheckInPhotos },
        { title: "Host Check-out Photos", photos: hostCheckOutPhotos },
      ];

      setSections(photoSections);

      // Flatten all photos for modal navigation
      const allPhotoUrls = [
        ...guestCheckInPhotos,
        ...guestCheckOutPhotos,
        ...hostCheckInPhotos,
        ...hostCheckOutPhotos,
      ].map((p) => p.url);
      setAllPhotos(allPhotoUrls);
    } catch (error) {
      console.error("Error fetching trip photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const groupPhotosByCategory = (photos: PhotoItem[]) => {
    const grouped: Record<PhotoCategory, PhotoItem[]> = {
      exterior: [],
      interior: [],
      odometer: [],
      fuel: [],
    };

    photos.forEach((photo) => {
      grouped[photo.category].push(photo);
    });

    return grouped;
  };

  const openPhotoModal = (photoUrl: string) => {
    const index = allPhotos.indexOf(photoUrl);
    setCurrentPhotoIndex(index);
    setSelectedPhoto(photoUrl);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    let newIndex = currentPhotoIndex;
    if (direction === "prev" && currentPhotoIndex > 0) {
      newIndex = currentPhotoIndex - 1;
    } else if (
      direction === "next" &&
      currentPhotoIndex < allPhotos.length - 1
    ) {
      newIndex = currentPhotoIndex + 1;
    }
    setCurrentPhotoIndex(newIndex);
    setSelectedPhoto(allPhotos[newIndex]);
  };

  const renderPhotoSection = (section: PhotoSection) => {
    if (section.photos.length === 0) {
      return (
        <View key={section.title} className="mb-6 mx-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary-50 p-2 rounded-full mr-3">
                <MaterialIcons name="photo-library" size={20} color="#0066FF" />
              </View>
              <Text className="font-JakartaBold text-lg text-gray-900">
                {section.title}
              </Text>
            </View>
            <View className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-dashed border-gray-300">
              <MaterialIcons
                name="photo-camera"
                size={32}
                color="#9CA3AF"
                style={{ alignSelf: "center", marginBottom: 8 }}
              />
              <Text className="font-JakartaMedium text-gray-500 text-center text-sm">
                No photos submitted for this section
              </Text>
            </View>
          </View>
        </View>
      );
    }

    const groupedPhotos = groupPhotosByCategory(section.photos);

    return (
      <View key={section.title} className="mb-6 mx-4">
        <View className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          {/* Section Header */}
          <View className="flex-row items-center mb-4">
            <View className="bg-primary-500 p-2.5 rounded-full mr-3">
              <MaterialIcons name="photo-library" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-JakartaBold text-lg text-gray-900">
                {section.title}
              </Text>
              <Text className="font-Jakarta text-xs text-gray-500 mt-0.5">
                {section.photos.length} photo
                {section.photos.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View className="bg-green-50 px-3 py-1.5 rounded-full">
              <Text className="font-JakartaBold text-xs text-green-700">
                Complete
              </Text>
            </View>
          </View>

          {/* Categories */}
          {(Object.keys(groupedPhotos) as PhotoCategory[]).map((category) => {
            const categoryPhotos = groupedPhotos[category];
            if (categoryPhotos.length === 0) return null;

            return (
              <View key={category} className="mb-5">
                {/* Category Header */}
                <View className="flex-row items-center mb-3 bg-gray-50 px-3 py-2 rounded-lg">
                  <View className="bg-white p-1.5 rounded-lg mr-2 shadow-sm">
                    <MaterialIcons
                      name={categoryIcons[category] as any}
                      size={18}
                      color="#4B5563"
                    />
                  </View>
                  <Text className="font-JakartaSemiBold text-sm text-gray-800 capitalize flex-1">
                    {category}
                  </Text>
                  <View className="bg-primary-100 px-2 py-1 rounded-full">
                    <Text className="font-JakartaBold text-xs text-primary-700">
                      {categoryPhotos.length}
                    </Text>
                  </View>
                </View>

                {/* Photo Grid */}
                <View className="flex-row flex-wrap gap-2.5">
                  {categoryPhotos.map((photo, index) => (
                    <TouchableOpacity
                      key={`${category}-${index}`}
                      onPress={() => openPhotoModal(photo.url)}
                      activeOpacity={0.8}
                      className="bg-white rounded-xl overflow-hidden shadow-lg"
                      style={{
                        width: (SCREEN_WIDTH - 64) / 3,
                        elevation: 3,
                      }}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={{
                          width: (SCREEN_WIDTH - 64) / 3,
                          height: (SCREEN_WIDTH - 64) / 3,
                        }}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)"]}
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: 6,
                        }}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="access-time"
                            size={10}
                            color="white"
                          />
                          <Text className="font-Jakarta text-[9px] text-white ml-1">
                            {formatTimestamp(photo.timestamp)}
                          </Text>
                        </View>
                      </LinearGradient>
                      {/* Zoom Indicator */}
                      <View className="absolute top-2 right-2 bg-black/40 p-1 rounded-full">
                        <MaterialIcons name="zoom-in" size={12} color="white" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <View className="bg-white p-8 rounded-3xl shadow-lg">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="font-JakartaMedium text-gray-600 mt-4">
            Loading photos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />

        {/* Header with Gradient */}
        <View className="bg-white shadow-sm">
          <View className="flex-row items-center justify-between px-4 py-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
            >
              <MaterialIcons name="arrow-back" size={22} color="#1F2937" />
            </Pressable>

            <View className="flex-1 items-center">
              <Text className="text-lg font-JakartaBold text-gray-900">
                Trip Photos
              </Text>
              <Text className="text-xs font-Jakarta text-gray-500 mt-0.5">
                Documentation Review
              </Text>
            </View>

            <View className="w-10" />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        >
          {sections.map((section) => renderPhotoSection(section))}
        </ScrollView>

        {/* Photo Modal */}
        <PhotoViewerModal
          visible={selectedPhoto !== null}
          photoUrl={selectedPhoto || ""}
          currentIndex={currentPhotoIndex}
          totalPhotos={allPhotos.length}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={navigatePhoto}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

interface PhotoViewerModalProps {
  visible: boolean;
  photoUrl: string;
  currentIndex: number;
  totalPhotos: number;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  photoUrl,
  currentIndex,
  totalPhotos,
  onClose,
  onNavigate,
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.ease });
      scale.value = 1;
      savedScale.value = 1;
    } else {
      opacity.value = 0;
    }
  }, [visible, photoUrl]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, 4));
    })
    .onEnd(() => {
      if (scale.value < 1.2) {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        savedScale.value = 1;
      } else {
        savedScale.value = scale.value;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .maxDelay(500)
    .onStart(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        savedScale.value = 1;
      } else {
        scale.value = withSpring(2.5, {
          damping: 15,
          stiffness: 150,
        });
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[{ flex: 1, backgroundColor: "#000" }, overlayStyle]}
      >
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <SafeAreaView>
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "transparent"]}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-white/10 rounded-full"
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>

              <View className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-lg">
                <Text className="font-JakartaBold text-white text-sm">
                  {currentIndex + 1} / {totalPhotos}
                </Text>
              </View>

              <TouchableOpacity
                className="p-2 bg-white/10 rounded-full"
                activeOpacity={0.8}
              >
                <MaterialIcons name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>

        {/* Image */}
        <View className="flex-1 justify-center items-center">
          <GestureDetector gesture={composed}>
            <Animated.Image
              source={{ uri: photoUrl }}
              style={[
                {
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT * 0.7,
                },
                animatedStyle,
              ]}
              resizeMode="contain"
            />
          </GestureDetector>

          {/* Zoom Hint */}
          <View className="absolute bottom-4 bg-black/50 px-4 py-2 rounded-full">
            <Text className="font-Jakarta text-white text-xs">
              Pinch or double tap to zoom
            </Text>
          </View>
        </View>

        {/* Navigation */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{ paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 }}
        >
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => onNavigate("prev")}
              disabled={currentIndex === 0}
              className={`p-4 rounded-full ${
                currentIndex === 0 ? "opacity-30" : "opacity-100"
              }`}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-left" size={32} color="white" />
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="p-3 bg-white/20 rounded-full"
                activeOpacity={0.8}
              >
                <MaterialIcons name="file-download" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-3 bg-white/20 rounded-full"
                activeOpacity={0.8}
              >
                <MaterialIcons name="more-vert" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => onNavigate("next")}
              disabled={currentIndex === totalPhotos - 1}
              className={`p-4 rounded-full ${
                currentIndex === totalPhotos - 1 ? "opacity-30" : "opacity-100"
              }`}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-right" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

export default TripPhotosReviewScreen;