import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
  Camera,
  NativePreviewView,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
  usePreviewOutput,
  VisionCamera,
} from "react-native-vision-camera";

import { useLocation } from "react-native-vision-camera-location";

import { useIsFocused } from "@react-navigation/core";

import { compressImage } from "@/helpers/compress-image";
import { colors } from "@/theme/colors";
import { boldFont } from "@/theme/fonts";
import {
  provideHapticFeedback,
  screenHeight,
  screenWidth,
} from "@/utils/utils";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

/* Lucide Icons */
import {
  Camera as CameraIcon,
  ChevronDown,
  Download,
  Flashlight,
  FlashlightOff,
  MapPin,
  MapPinOff,
  RefreshCw,
  SunMedium,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";

import { RulerPicker } from "react-native-legend-ruler-picker";
import { VolumeManager } from "react-native-volume-manager";
import * as DropdownMenu from "zeego/dropdown-menu";

/* ─── Constants ─── */

const PHOTO_FORMATS = ["jpeg", "heic"] as const;
const FPS_OPTIONS = [24, 30, 60, 120] as const;

/* ─── Format & FPS Dropdown ─── */

function FormatFpsDropdown({
  selectedFormat,
  onFormatChange,
  selectedFps,
  onFpsChange,
  device,
}: {
  selectedFormat: string;
  onFormatChange: (f: string) => void;
  selectedFps: number;
  onFpsChange: (f: number) => void;
  device: any;
}) {
  return (
    <View style={styles.dropdownRow}>
      {/* Format Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View style={styles.dropdownTrigger}>
            <Text style={styles.dropdownText}>
              {selectedFormat.toUpperCase()}
            </Text>
            <ChevronDown size={16} color="#fff" strokeWidth={2} />
          </View>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content sideOffset={5}>
          <DropdownMenu.Label>Photo Format</DropdownMenu.Label>
          {PHOTO_FORMATS.map((fmt) => (
            <DropdownMenu.Item key={fmt} onSelect={() => onFormatChange(fmt)}>
              <DropdownMenu.ItemTitle>
                {fmt.toUpperCase()}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {/* FPS Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View style={styles.dropdownTrigger}>
            <Text style={styles.dropdownText}>{selectedFps} FPS</Text>
            <ChevronDown size={16} color="#fff" strokeWidth={2} />
          </View>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content sideOffset={5}>
          <DropdownMenu.Label>Frame Rate</DropdownMenu.Label>
          {FPS_OPTIONS.map((fps) => {
            // Check if device supports this FPS
            const supported = device?.supportsFPS?.(fps) ?? false;
            return (
              <DropdownMenu.Item
                key={fps}
                onSelect={() => onFpsChange(fps)}
                disabled={!supported}
              >
                <DropdownMenu.ItemTitle>
                  {fps} FPS{!supported ? " (unsupported)" : ""}
                </DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
}

/* ─── Multi-Cam Toggle Button ─── */

function MultiCamButton({
  isMultiCam,
  onToggle,
  supported,
}: {
  isMultiCam: boolean;
  onToggle: () => void;
  supported: boolean;
}) {
  if (!supported) return null;

  return (
    <Pressable
      style={[
        styles.iconButton,
        {
          position: "absolute",
          top: 335,
          right: 20,
          zIndex: 200,
          backgroundColor: isMultiCam ? colors.primary : "#EFEEFE",
        },
      ]}
      onPress={onToggle}
    >
      <CameraIcon
        size={24}
        color={isMultiCam ? "#fff" : "#15202B"}
        strokeWidth={2}
      />
      {/* Small "2x" badge to indicate dual cam */}
      <View style={styles.multiCamBadge}>
        <Text style={styles.multiCamBadgeText}>2</Text>
      </View>
    </Pressable>
  );
}

/* ─── Multi-Cam View ─── */

function MultiCamView({ onCapture }: { onCapture: (path: string) => void }) {
  const frontDevice = useCameraDevice("front");
  const backDevice = useCameraDevice("back");
  const frontPreview = usePreviewOutput();
  const backPreview = usePreviewOutput();
  const frontPhoto = usePhotoOutput();
  const backPhoto = usePhotoOutput();

  useEffect(() => {
    let activeSession: any = null;

    const startSession = async () => {
      if (!frontDevice || !backDevice) return;

      try {
        const s = await VisionCamera.createCameraSession(true);
        activeSession = s;

        await s.configure(
          [
            // Front Camera
            {
              input: frontDevice,
              outputs: [
                { output: frontPreview, mirrorMode: "on" },
                { output: frontPhoto, mirrorMode: "off" },
              ],
              constraints: [],
            },
            // Back Camera
            {
              input: backDevice,
              outputs: [
                { output: backPreview, mirrorMode: "off" },
                { output: backPhoto, mirrorMode: "off" },
              ],
              constraints: [],
            },
          ],
          {},
        );

        await s.start();
      } catch (err) {
        console.log("Multi-cam session failed:", err);
      }
    };

    startSession();

    return () => {
      activeSession?.stop?.();
    };
  }, [frontDevice, backDevice]);

  const captureBothPhotos = useCallback(async () => {
    try {
      const { filePath } = await backPhoto.capturePhotoToFile({}, {});
      onCapture(filePath);
    } catch (err) {
      console.log("Multi-cam capture failed:", err);
    }
  }, [backPhoto, onCapture]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Back camera — full screen */}
      <NativePreviewView
        style={StyleSheet.absoluteFill}
        previewOutput={backPreview}
      />

      {/* Front camera — PIP overlay (Instagram-style) */}
      <View style={styles.pipContainer}>
        <NativePreviewView
          style={styles.pipPreview}
          previewOutput={frontPreview}
        />
      </View>

      {/* Capture button for multi-cam mode */}
      <View style={styles.rightButtonRow}>
        <View style={styles.button} />
        <TouchableOpacity onPress={captureBothPhotos}>
          <View style={styles.captureRing}>
            <View style={styles.captureInner} />
          </View>
        </TouchableOpacity>
        <View style={styles.button} />
      </View>
    </View>
  );
}

/* ─── Main Component ─── */

const TakePhoto = () => {
  const router = useRouter();

  const [over, setOver] = useState(false);

  const [fileUri, setFileUri] = useState("");

  /* Permissions — V5 uses useCameraPermission hook */
  const { hasPermission, requestPermission } = useCameraPermission();

  /* Location */
  const locationManager = useLocation();
  const [isLocationEnabled, setIsLocationEnabled] = useState(
    locationManager.hasPermission,
  );

  /* Camera state */
  const [cameraPosition, setCameraPosition] = useState<"back" | "front">(
    "back",
  );
  const [torch, setTorch] = useState<"off" | "on">("off");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [showExposure, setShowExposure] = useState(false);

  /* Format & FPS state */
  const [photoFormat, setPhotoFormat] = useState<string>("jpeg");

  const [targetFps, setTargetFps] = useState<number>(30);

  /* Multi-cam state */
  const [isMultiCam, setIsMultiCam] = useState(false);
  const supportsMultiCam = VisionCamera.supportsMultiCamSessions ?? false;

  /* Device */
  const device = useCameraDevice(cameraPosition);

  /* V5 outputs — usePhotoOutput replaces old ref-based takePhoto */
  const photoOutput = usePhotoOutput({
    qualityPrioritization: "balanced",
    quality: 0.95,
  });

  /* V5 — zoom and exposure via SharedValue, passed directly to <Camera /> */

  const exposure = useSharedValue(0);

  const isFocused = useIsFocused();

  const isActive = isFocused && !over && !isMultiCam;

  /* Rotation animation for icon buttons */
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const animatedStyle = {
    transform: [
      {
        rotate: rotationAnim.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  /* Request permissions on mount */
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (isActive) {
      setOver(false);
      StatusBar.setBarStyle("light-content", true);
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent", true);
        StatusBar.setTranslucent(true);
      }
    }
  }, [isActive]);

  /* Volume button as shutter */
  useEffect(() => {
    VolumeManager.showNativeVolumeUI({ enabled: false });

    const volumeListener = VolumeManager.addVolumeListener(() => {
      takePhoto();
      provideHapticFeedback();
    });

    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent", true);
    }

    return () => {
      volumeListener.remove();
      VolumeManager.showNativeVolumeUI({ enabled: true });
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("white", true);
      }
    };
  }, []);

  /* Flash & torch props */
  const supportsFlash = device?.hasFlash ?? false;
  const supportsTorch = device?.hasTorch ?? false;

  /* Callbacks */
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const onTorchPressed = useCallback(() => {
    setTorch((t) => (t === "off" ? "on" : "off"));
  }, []);

  /* V5 takePhoto — uses photoOutput.capturePhotoToFile */
  const takePhoto = useCallback(async () => {
    try {
      // Build capture settings — include location if enabled
      const settings: any = {
        flash: flash,
      };

      if (isLocationEnabled && locationManager.hasPermission) {
        settings.location = locationManager.currentLocation;
      }

      const { filePath } = await photoOutput.capturePhotoToFile(settings, {});

      onMediaCaptured(filePath);
    } catch (e) {
      console.log("Failed to take photo!", e);
    }
  }, [flash, isLocationEnabled, locationManager, photoOutput]);

  const onMediaCaptured = async (path: string) => {
    setOver(true);

    const compressedImage = await compressImage(path);

    setFileUri(compressedImage);
  };

  const saveImageToCameraRoll = async () => {
    try {
      await CameraRoll.saveAsset(fileUri, { type: "photo" });
      alert("Image Saved");
      setOver(false);
      back();
    } catch (error) {
      console.log(error);
    }
  };

  function back() {
    router.back();
    StatusBar.setBarStyle("dark-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("white", true);
    }
  }

  async function handlePhotolocationPermissions() {
    await locationManager.requestPermission();
    setIsLocationEnabled(!isLocationEnabled);
  }

  function handleManageExposure() {
    setShowExposure(!showExposure);
  }

  function handleMultiCamToggle() {
    setIsMultiCam((prev) => !prev);
  }

  const onError = useCallback((error: any) => {
    console.log("Camera error:", error);
  }, []);

  /* ─── Photo Preview (after capture) ─── */
  if (over) {
    return (
      <View style={{ backgroundColor: "black", flex: 1 }}>
        <StatusBar backgroundColor="transparent" translucent={true} animated />

        {/* Back button */}
        {/* <Pressable
          style={[
            styles.iconButton,
            { position: "absolute", top: 60, left: 20, zIndex: 200 },
          ]}
          onPress={back}
        >
          <ArrowLeft size={24} color="#15202B" strokeWidth={2} />
        </Pressable> */}

        {/* Close button */}
        <Pressable
          style={[
            styles.iconButton,
            { position: "absolute", top: 60, right: 20, zIndex: 200 },
          ]}
          onPress={back}
        >
          <X size={24} color="#15202B" strokeWidth={2} />
        </Pressable>

        {/* Preview image */}
        <Image
          source={{ uri: fileUri }}
          style={{ height: screenHeight, width: screenWidth }}
          contentFit="cover"
        />

        {/* Save button */}
        <View style={styles.rightButtonRow}>
          <Pressable style={styles.fullButton} onPress={saveImageToCameraRoll}>
            <Download size={22} color="#15202B" strokeWidth={2} />
            <Text
              style={{
                fontFamily: boldFont,
                fontSize: 22,
                color: "#15202B",
                marginLeft: 6,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ─── Multi-Cam Mode ─── */
  if (isMultiCam && supportsMultiCam) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="transparent" translucent={true} animated />

        {/* Back button */}
        {/* <Pressable
          style={[
            styles.iconButton,
            { position: "absolute", top: 70, left: 20, zIndex: 200 },
          ]}
          onPress={back}
        >
          <ArrowLeft size={24} color="#15202B" strokeWidth={2} />
        </Pressable> */}

        {/* Exit multi-cam */}
        <Pressable
          style={[
            styles.iconButton,
            {
              position: "absolute",
              top: 70,
              right: 20,
              zIndex: 200,
              backgroundColor: colors.primary,
            },
          ]}
          onPress={handleMultiCamToggle}
        >
          <CameraIcon size={24} color="#fff" strokeWidth={2} />
        </Pressable>

        <MultiCamView onCapture={onMediaCaptured} />
      </View>
    );
  }

  /* ─── Normal Camera Mode ─── */
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent={true} animated />

      {/* Back button */}
      {/* <Pressable
        style={[
          styles.iconButton,
          { position: "absolute", top: 70, left: 20, zIndex: 200 },
        ]}
        onPress={back}
      >
        <ArrowLeft size={24} color="#15202B" strokeWidth={2} />
      </Pressable> */}

      {/* Flash toggle */}
      {supportsFlash && (
        <Pressable
          style={[
            styles.iconButton,
            { position: "absolute", top: 70, right: 20, zIndex: 200 },
          ]}
          onPress={onFlashPressed}
        >
          <Animated.View style={animatedStyle}>
            {flash === "on" ? (
              <Zap size={24} color="#15202B" strokeWidth={2} />
            ) : (
              <ZapOff size={24} color="#15202B" strokeWidth={2} />
            )}
          </Animated.View>
        </Pressable>
      )}

      {/* Torch toggle */}
      {supportsTorch && (
        <Pressable
          style={[
            styles.iconButton,
            {
              position: "absolute",
              top: 140,
              right: 20,
              zIndex: 200,
              backgroundColor: torch === "on" ? colors.primary : "#EFEEFE",
            },
          ]}
          onPress={onTorchPressed}
        >
          <Animated.View style={animatedStyle}>
            {torch === "on" ? (
              <Flashlight size={24} color="#fff" strokeWidth={2} />
            ) : (
              <FlashlightOff size={24} color="#15202B" strokeWidth={2} />
            )}
          </Animated.View>
        </Pressable>
      )}

      {/* Location toggle */}
      <Pressable
        style={[
          styles.iconButton,
          { position: "absolute", top: 205, right: 20, zIndex: 200 },
        ]}
        onPress={handlePhotolocationPermissions}
      >
        <Animated.View style={animatedStyle}>
          {isLocationEnabled ? (
            <MapPin size={24} color="#15202B" strokeWidth={2} />
          ) : (
            <MapPinOff size={24} color="#15202B" strokeWidth={2} />
          )}
        </Animated.View>
      </Pressable>

      {/* Exposure toggle */}
      <Pressable
        style={[
          styles.iconButton,
          {
            position: "absolute",
            top: 270,
            right: 20,
            zIndex: 200,
            backgroundColor: showExposure ? colors.primary : "#EFEEFE",
          },
        ]}
        onPress={handleManageExposure}
      >
        <Animated.View style={animatedStyle}>
          <SunMedium
            size={24}
            color={showExposure ? "#fff" : "#15202B"}
            strokeWidth={2}
          />
        </Animated.View>
      </Pressable>

      {/* Multi-cam button */}
      <MultiCamButton
        isMultiCam={isMultiCam}
        onToggle={handleMultiCamToggle}
        supported={supportsMultiCam}
      />

      {device != null && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          onError={onError}
          outputs={[photoOutput]}
          exposure={exposure}
          torchMode={torch}
          enableNativeZoomGesture={true}
          enableNativeTapToFocusGesture={true}
          constraints={[{ fps: targetFps }]}
          orientationSource="device"
        />
      )}

      {/* ─── Format & FPS Dropdowns ─── */}
      <FormatFpsDropdown
        selectedFormat={photoFormat}
        onFormatChange={setPhotoFormat}
        selectedFps={targetFps}
        onFpsChange={setTargetFps}
        device={device}
      />

      {/* ─── Bottom Controls ─── */}
      {showExposure ? (
        <View style={{ position: "absolute", bottom: 0, width: screenWidth }}>
          <RulerPicker
            min={device?.minExposureBias ?? -2}
            max={device?.maxExposureBias ?? 2}
            step={0.5}
            fractionDigits={1}
            initialValue={0}
            onValueChange={(number: string) => {
              exposure.value = Number(number);
            }}
            onValueChangeEnd={(number: string) => {
              exposure.value = Number(number);
            }}
            unit=""
            shortStepColor={colors.primary}
            longStepColor="white"
            indicatorColor="white"
            valueTextStyle={{
              color: "white",
            }}
            unitTextStyle={{
              color: "white",
            }}
          />
        </View>
      ) : (
        <View style={styles.rightButtonRow}>
          <View style={styles.button} />

          {/* Shutter button */}
          <TouchableOpacity
            onPress={() => {
              takePhoto();
              provideHapticFeedback();
            }}
          >
            <View style={styles.captureRing}>
              <View style={styles.captureInner} />
            </View>
          </TouchableOpacity>

          {/* Flip camera */}
          <Animated.View style={animatedStyle}>
            <Pressable style={styles.fullButton} onPress={onFlipCameraPressed}>
              <RefreshCw size={28} color="#15202B" strokeWidth={2} />
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default TakePhoto;

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFEEFE",
    borderRadius: 100,
    padding: 10,
  },
  fullButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFEEFE",
    borderRadius: 100,
    padding: 10,
    flexDirection: "row",
  },
  rightButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 100,
    width: screenWidth,
  },

  /* Shutter button — pure View-based, no image asset needed */
  captureRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },

  /* Format / FPS dropdown row */
  dropdownRow: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
    zIndex: 300,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Multi-cam badge */
  multiCamBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  multiCamBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  /* Multi-cam PIP (Instagram-style) */
  pipContainer: {
    position: "absolute",
    top: 80,
    left: 20,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 100,
  },
  pipPreview: {
    flex: 1,
  },
});
