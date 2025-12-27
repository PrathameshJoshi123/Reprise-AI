import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Gyroscope, LightSensor } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useDiagnostic } from "./context";

const { width, height } = Dimensions.get("window");
const GRID_COLS = 6;
const GRID_ROWS = 3;

const Tests = () => {
  const { currentStep, setCurrentStep, updateTest } = useDiagnostic();

  const handleTestComplete = useCallback(
    (
      testName:
        | "touchscreen"
        | "microphone"
        | "speaker"
        | "gyroscope"
        | "proximity",
      status: "PASSED" | "FAILED"
    ) => {
      updateTest(testName, status);

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // All tests complete, navigate to results
        router.replace("/diagnostic/result");
      }
    },
    [currentStep, setCurrentStep, updateTest]
  );

  const renderTest = () => {
    switch (currentStep) {
      case 0:
        return (
          <TouchscreenTest
            onComplete={() => handleTestComplete("touchscreen", "PASSED")}
          />
        );
      case 1:
        return (
          <AudioTest
            onComplete={(passed) =>
              handleTestComplete("microphone", passed ? "PASSED" : "FAILED")
            }
            onSpeakerComplete={(passed) =>
              handleTestComplete("speaker", passed ? "PASSED" : "FAILED")
            }
          />
        );
      case 2:
        return (
          <GyroscopeTest
            onComplete={() => handleTestComplete("gyroscope", "PASSED")}
          />
        );
      case 3:
        return (
          <ProximityTest
            onComplete={() => handleTestComplete("proximity", "PASSED")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">{renderTest()}</SafeAreaView>
  );
};

// Test 1: Touchscreen Grid Test
const TouchscreenTest = ({ onComplete }: { onComplete: () => void }) => {
  const [touchedCells, setTouchedCells] = useState<Set<string>>(new Set());
  const cellWidth = width / GRID_COLS;
  const cellHeight = (height * 0.7) / GRID_ROWS;
  const totalCells = GRID_COLS * GRID_ROWS;

  // Ref to measure grid position on screen
  const gridRef = useRef<View>(null);
  const gridOffset = useRef({ x: 0, y: 0 });

  // Measure grid container position once mounted
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.measureInWindow((x, y) => {
        gridOffset.current = { x, y };
      });
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent),
    })
  ).current;

  const handleTouch = (event: any) => {
    // Use pageX/pageY (absolute screen coords) instead of locationX/locationY
    const relativeX = event.pageX - gridOffset.current.x;
    const relativeY = event.pageY - gridOffset.current.y;

    const col = Math.floor(relativeX / cellWidth);
    const row = Math.floor(relativeY / cellHeight);
    const cellKey = `${row}-${col}`;

    if (
      col >= 0 &&
      col < GRID_COLS &&
      row >= 0 &&
      row < GRID_ROWS &&
      !touchedCells.has(cellKey)
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTouchedCells((prev) => new Set(prev).add(cellKey));
    }
  };

  useEffect(() => {
    if (touchedCells.size === totalCells) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onComplete, 500);
    }
  }, [onComplete, totalCells, touchedCells]);

  const progress = (touchedCells.size / totalCells) * 100;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 bg-gray-800">
        <Text className="text-white text-2xl font-bold">Touchscreen Test</Text>
        <Text className="text-gray-400 text-sm mt-1">Touch all grid cells</Text>
        <View className="mt-4 bg-gray-700 h-2 rounded-full overflow-hidden">
          <View
            style={{ width: `${progress}%` }}
            className="h-full bg-green-500"
          />
        </View>
        <Text className="text-white text-sm mt-2">
          {touchedCells.size}/{totalCells} cells
        </Text>
      </View>

      {/* Grid */}
      <View
        ref={gridRef}
        {...panResponder.panHandlers}
        className="flex-1 bg-gray-900"
      >
        {Array.from({ length: GRID_ROWS }).map((_, row) => (
          <View key={row} className="flex-row">
            {Array.from({ length: GRID_COLS }).map((_, col) => {
              const cellKey = `${row}-${col}`;
              const isTouched = touchedCells.has(cellKey);
              return (
                <View
                  key={col}
                  style={{ width: cellWidth, height: cellHeight }}
                  className={`border border-gray-800 ${isTouched ? "bg-green-500" : "bg-gray-700"}`}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

// Test 2: Audio Test (Microphone + Speaker)
const AudioTest = ({
  onComplete,
  onSpeakerComplete,
}: {
  onComplete: (passed: boolean) => void;
  onSpeakerComplete: (passed: boolean) => void;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micPassed, setMicPassed] = useState(false);
  const [showSpeakerTest, setShowSpeakerTest] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const setup = async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    };
    setup();

    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount - use IIFE to handle async
      (async () => {
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (e) {
            // Ignore
          }
          recordingRef.current = null;
        }
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch (e) {
            // Ignore
          }
          soundRef.current = null;
        }
      })();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime > 1) {
            setMicPassed(true);
          }
          return newTime;
        });
      }, 100);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Prevent double start
      if (isRecording || recordingRef.current) {
        console.log("Recording already in progress");
        return;
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Microphone permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = newRecording;
      if (isMountedRef.current) {
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      recordingRef.current = null;
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      const currentRecording = recordingRef.current;
      recordingRef.current = null;

      if (isMountedRef.current) {
        setIsRecording(false);
      }

      await currentRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (isMountedRef.current) {
        if (micPassed) {
          onComplete(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowSpeakerTest(true);
            }
          }, 500);
        } else {
          Alert.alert(
            "Microphone Test Failed",
            "Please try again and speak louder"
          );
          onComplete(false);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const playSpeakerTest = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      });
      soundRef.current = newSound;
      await newSound.playAsync();
    } catch (err) {
      console.error("Failed to play sound", err);
    }
  };

  const handleSpeakerResponse = (heard: boolean) => {
    onSpeakerComplete(heard);
  };

  if (showSpeakerTest) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          backgroundColor: "#111827",
        }}
      >
        <View
          style={{
            backgroundColor: "#9333EA",
            padding: 32,
            borderRadius: 9999,
            marginBottom: 24,
          }}
        >
          <Ionicons name="volume-high" size={64} color="white" />
        </View>
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Speaker Test
        </Text>
        <Text
          style={{ color: "#9CA3AF", textAlign: "center", marginBottom: 32 }}
        >
          A sound will play. Did you hear it?
        </Text>

        <TouchableOpacity
          onPress={playSpeakerTest}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 12,
            paddingHorizontal: 32,
            paddingVertical: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="play" size={20} color="white" />
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 18,
                marginLeft: 8,
              }}
            >
              Play Test Sound
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", marginTop: 32, gap: 16 }}>
          <TouchableOpacity
            onPress={() => handleSpeakerResponse(true)}
            style={{
              backgroundColor: "#16A34A",
              borderRadius: 9999,
              paddingHorizontal: 24,
              paddingVertical: 16,
              flex: 1,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Yes, I Heard It
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSpeakerResponse(false)}
            style={{
              backgroundColor: "#DC2626",
              borderRadius: 9999,
              paddingHorizontal: 24,
              paddingVertical: 16,
              flex: 1,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              No Sound
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "#111827",
      }}
    >
      <View
        style={{
          padding: 32,
          borderRadius: 9999,
          marginBottom: 24,
          backgroundColor: isRecording ? "#EF4444" : "#2563EB",
        }}
      >
        <Ionicons name="mic" size={64} color="white" />
      </View>
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Microphone Test
      </Text>
      <Text style={{ color: "#9CA3AF", textAlign: "center", marginBottom: 32 }}>
        Speak into the Mic
      </Text>

      {isRecording && (
        <View style={{ width: 256, marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#EF4444",
                marginRight: 8,
              }}
            />
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Recording...
            </Text>
          </View>
          <Text style={{ color: "white", textAlign: "center" }}>
            {recordingTime.toFixed(1)}s
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={{
          backgroundColor: isRecording ? "#DC2626" : "#2563EB",
          borderRadius: 9999,
          paddingHorizontal: 32,
          paddingVertical: 16,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      {micPassed && (
        <View
          style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={{ color: "#10B981", marginLeft: 8, fontWeight: "bold" }}>
            Microphone Passed!
          </Text>
        </View>
      )}
    </View>
  );
};

// Test 3: Gyroscope Stability Test
const GyroscopeTest = ({ onComplete }: { onComplete: () => void }) => {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [stabilityTime, setStabilityTime] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    const subscription = Gyroscope.addListener((data) => {
      setGyroData(data);

      // Update ball position based on gyroscope
      Animated.spring(ballPosition, {
        toValue: { x: data.y * 100, y: data.x * 100 },
        useNativeDriver: false,
      }).start();

      // Check stability (x and y < 0.1)
      if (Math.abs(data.x) < 0.1 && Math.abs(data.y) < 0.1) {
        setIsStable(true);
      } else {
        setIsStable(false);
        setStabilityTime(0);
      }
    });

    Gyroscope.setUpdateInterval(100);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStable) {
      interval = setInterval(() => {
        setStabilityTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(onComplete, 500);
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isStable]);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold text-center mb-4">
        Gyroscope Test
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        Hold your device perfectly flat for 3 seconds
      </Text>

      {/* Stability Circle */}
      <View className="relative w-64 h-64 bg-gray-800 rounded-full items-center justify-center mb-8">
        <View className="w-32 h-32 border-2 border-white/30 rounded-full" />
        <Animated.View
          style={{
            position: "absolute",
            transform: [
              { translateX: ballPosition.x },
              { translateY: ballPosition.y },
            ],
          }}
          className={`w-12 h-12 ${isStable ? "bg-green-500" : "bg-blue-500"} rounded-full`}
        />
      </View>

      {/* Progress */}
      <View className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
        <View
          style={{ width: `${(stabilityTime / 3) * 100}%` }}
          className="h-full bg-green-500"
        />
      </View>
      <Text className="text-white text-lg">
        {stabilityTime.toFixed(1)}s / 3.0s
      </Text>

      <Text className="text-gray-400 text-sm mt-4">
        X: {gyroData.x.toFixed(2)} | Y: {gyroData.y.toFixed(2)}
      </Text>
    </View>
  );
};

// Test 4: Proximity/Light Sensor Test
const ProximityTest = ({ onComplete }: { onComplete: () => void }) => {
  const [lightLevel, setLightLevel] = useState(0);
  const [baselineLight, setBaselineLight] = useState<number | null>(null);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const subscription = LightSensor.addListener((data) => {
      setLightLevel(data.illuminance);

      // Set baseline after 1 second
      if (baselineLight === null) {
        setTimeout(() => setBaselineLight(data.illuminance), 1000);
      }

      // Detect >50% drop in light
      if (baselineLight !== null && data.illuminance < baselineLight * 0.5) {
        setDetected(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onComplete, 1000);
      }
    });

    LightSensor.setUpdateInterval(100);

    return () => subscription.remove();
  }, [baselineLight]);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View
        className={`${detected ? "bg-green-600" : "bg-yellow-600"} p-8 rounded-full mb-6`}
      >
        <Ionicons name="sunny" size={64} color="white" />
      </View>
      <Text className="text-white text-2xl font-bold text-center mb-4">
        Light Sensor Test
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        Wave your hand over the top of your device
      </Text>

      {/* Light Meter */}
      <View className="w-64 h-32 bg-gray-800 rounded-2xl items-center justify-center mb-4">
        <Text className="text-white text-4xl font-bold">
          {lightLevel.toFixed(0)}
        </Text>
        <Text className="text-gray-400">lux</Text>
      </View>

      {baselineLight !== null && (
        <Text className="text-gray-400 text-sm">
          Baseline: {baselineLight.toFixed(0)} lux | Need: &lt;
          {(baselineLight * 0.5).toFixed(0)} lux
        </Text>
      )}

      {detected && (
        <View className="mt-4 flex-row items-center">
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text className="text-green-500 ml-2 font-bold">
            Light Sensor Detected!
          </Text>
        </View>
      )}
    </View>
  );
};

export default Tests;
