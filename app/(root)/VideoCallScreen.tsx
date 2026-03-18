import CallDeclinedModal from "@/components/Calldeclinedmoda";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from "react-native-agora";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID!;

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callId, channelName, callerName } = useLocalSearchParams<{
    callId: string;
    channelName: string;
    callerId: string;
    callerName: string;
    isIncoming: string;
  }>();

  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showDeclined, setShowDeclined] = useState(false);

  useEffect(() => {
    setupAgora();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (joined && remoteUid !== null) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [joined, remoteUid]);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const cameraOk =
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] === "granted";
      const audioOk =
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === "granted";
    //   console.log("📷 Camera:", cameraOk, "🎤 Audio:", audioOk);
      if (!cameraOk || !audioOk) {
        Alert.alert(
          "Permissions Required",
          "Camera and microphone access are needed.",
          [{ text: "OK", onPress: () => router.back() }],
        );
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (!callId) return;

    const unsub = onSnapshot(doc(db, "calls", callId), (snap) => {
      const data = snap.data();
      if (data?.status === "declined") {
        cleanup();
        setShowDeclined(true);
      }
    });

    return () => unsub();
  }, [callId]);

  const setupAgora = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;

      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.enableVideo();
      engine.startPreview();
      engine.setEnableSpeakerphone(true);

      engine.registerEventHandler({
        onJoinChannelSuccess: () => setJoined(true),
        onUserJoined: (_connection, uid) => setRemoteUid(uid),
        onUserOffline: () => {
          setRemoteUid(null);
          endCall();
        },
        onError: (err) => console.error("Agora error:", err),
      });

      await engine.joinChannel("", channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (error) {
      console.error("Agora setup error:", error);
      Alert.alert("Error", "Failed to start video call");
      router.back();
    }
  };

  const cleanup = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (agoraEngineRef.current) {
      agoraEngineRef.current.leaveChannel();
      agoraEngineRef.current.release();
      agoraEngineRef.current = null;
    }
  };

  const endCall = async () => {
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "ended",
        endedAt: serverTimestamp(),
        duration: callDuration,
      });
    } catch (e) {}
    await cleanup();
    router.back();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <View className="flex-1 bg-black">
      {/* Remote video full screen */}
      {remoteUid !== null ? (
        <RtcSurfaceView
          className="absolute inset-0"
          canvas={{
            uid: remoteUid,
            sourceType: VideoSourceType.VideoSourceRemote,
          }}
        />
      ) : (
        // Waiting screen
        <View className="flex-1 bg-[#1c1c2e] items-center justify-center">
          <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-4">
            <Feather name="user" size={48} color="rgba(255,255,255,0.5)" />
          </View>
          <Text className="text-white text-xl font-JakartaSemiBold">
            {callerName}
          </Text>
          <Text className="text-white/50 text-sm font-Jakarta mt-2">
            {joined ? "Waiting for other person..." : "Connecting..."}
          </Text>
        </View>
      )}

      {/* Dark overlay gradient at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 h-64 bg-black/50"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        pointerEvents="none"
      />

      {/* Local video PiP — top right */}
      {!isCameraOff && (
        <View
          className="absolute right-4 w-[90px] h-[126px] rounded-2xl overflow-hidden border-2 border-white/20"
          style={{ top: insets.top + 16 }}
        >
          <RtcSurfaceView
            className="flex-1"
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
          />
        </View>
      )}

      {/* Back button — top left */}
      <View style={{ position: "absolute", top: insets.top + 16, left: 16 }}>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
          onPress={() => router.back()}
        >
          <Feather name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Duration — top center */}
      {remoteUid !== null && (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ top: insets.top + 20 }}
        >
          <View className="bg-black/40 px-3 py-0.5 rounded-full">
            <Text className="text-white text-sm font-JakartaMedium">
              {formatDuration(callDuration)}
            </Text>
          </View>
        </View>
      )}

      {/* Caller name above controls */}
      <View
        className="absolute left-0 right-0 items-center mb-24"
        style={{ bottom: insets.bottom + 160 }}
      >
        <Text className="text-white text-lg font-JakartaSemiBold">
          {callerName}
        </Text>
      </View>

      {/* Controls */}
      <View
        className="absolute left-0 right-0 px-8"
        style={{ bottom: insets.bottom + 36 }}
      >
        {/* Main row — mute, end, camera */}
        <View className="flex-row justify-around items-center mb-5">
          <View className="items-center gap-1.5">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? "bg-white/40" : "bg-white/15"}`}
              onPress={() => {
                agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
                setIsMuted(!isMuted);
              }}
            >
              <Feather
                name={isMuted ? "mic-off" : "mic"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            <Text className="text-white/70 text-xs font-Jakarta">
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </View>

          <View className="items-center gap-1.5">
            <TouchableOpacity
              className="w-16 h-16 rounded-full bg-[#FF3B30] items-center justify-center"
              onPress={endCall}
            >
              <Feather name="phone-off" size={26} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white/70 text-xs font-Jakarta">End</Text>
          </View>

          <View className="items-center gap-1.5">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full items-center justify-center ${isCameraOff ? "bg-white/40" : "bg-white/15"}`}
              onPress={() => {
                agoraEngineRef.current?.muteLocalVideoStream(!isCameraOff);
                setIsCameraOff(!isCameraOff);
              }}
            >
              <Feather
                name={isCameraOff ? "video-off" : "video"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            <Text className="text-white/70 text-xs font-Jakarta">
              {isCameraOff ? "Start video" : "Stop video"}
            </Text>
          </View>
        </View>

        {/* Secondary row — flip, speaker */}
        <View className="flex-row justify-around items-center">
          <View className="items-center gap-1.5">
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
              onPress={() => agoraEngineRef.current?.switchCamera()}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white/60 text-xs font-Jakarta">Flip</Text>
          </View>

          <View className="items-center gap-1.5">
            <TouchableOpacity
              className={`w-11 h-11 rounded-full items-center justify-center ${isSpeakerOn ? "bg-white/25" : "bg-white/10"}`}
              onPress={() => {
                agoraEngineRef.current?.setEnableSpeakerphone(!isSpeakerOn);
                setIsSpeakerOn(!isSpeakerOn);
              }}
            >
              <Feather name="volume-2" size={18} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white/60 text-xs font-Jakarta">
              {isSpeakerOn ? "Speaker on" : "Speaker off"}
            </Text>
          </View>
        </View>

        <CallDeclinedModal
          visible={showDeclined}
          callerName={callerName}
          onBack={() => {
            setShowDeclined(false);
            router.back();
          }}
          onCallAgain={() => {
            setShowDeclined(false);
            router.back();
          }}
        />
      </View>
    </View>
  );
}
