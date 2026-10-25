import { useState, useRef, useEffect, useCallback } from "react";
import MCQPage from "./pages/MCQPage";

export default function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // States: 'idle' | ' requesting' | 'granted' | 'denied'
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown window
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Handle Camera Access with proper error handling & stream management
  const getCamera = useCallback(async () => {
    setCameraStatus("requesting");
    setErrorMessage("");

    // Guard clause for unsupported browsers or non-HTTPS environments
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("denied");
      setErrorMessage(
        "Camera API is not supported in your browser or requires a secure (HTTPS) connection."
      );
      return;
    }

    try {
      // Stop any existing tracks before requesting a new stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStatus("granted");

      // Edge-case safety: Listen if the user physically unplugs the camera
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraStatus("denied");
          setErrorMessage("Camera was disconnected. Please reconnect and try again.");
        };
      }
    } catch (err) {
      setCameraStatus("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage(
          "Camera permission was denied. Please allow access from your browser's address bar."
        );
      } else if (err.name === "NotFoundError") {
        setErrorMessage("No webcam device found on your system.");
      } else {
        setErrorMessage("Unable to access camera. Make sure no other app (like Zoom) is using it.");
      }
    }
  }, []);

  // 2. Handle Fullscreen Toggle
  const toggleFullScreen = useCallback(async () => {
    try {
      if (window.electronAPI && window.electronAPI.setFullScreen) {
        const full = await window.electronAPI.setFullScreen();
        setIsFullScreen(Boolean(full));
      } else if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      setErrorMessage("Failed to enter full screen mode. Your browser might be blocking it.");
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFullScreenChange) {
      const unsubscribe = window.electronAPI.onFullScreenChange((isFull) => {
        setIsFullScreen(Boolean(isFull));
      });
      return unsubscribe;
    }

    const handleFullScreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  };

  // Both checks must be true to unlock the test
  const isReadyToStart = cameraStatus === "granted" && isFullScreen;

  const handleQuizSubmit = useCallback(async () => {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStatus("idle");

    if (window.electronAPI && window.electronAPI.exitExam) {
      await window.electronAPI.exitExam();
    }

    // 3. Exit browser full-screen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        // ignore
      }
    }
    setIsFullScreen(false);

    // 4. Show thank you screen
    setIsSubmitted(true);
  }, []);

  // Listen for force submit event (e.g. user confirmed quit on Cmd+Q)
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onForceSubmit) {
      const unsubscribe = window.electronAPI.onForceSubmit(() => {
        handleQuizSubmit();
      });
      return unsubscribe;
    }
  }, [handleQuizSubmit]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-6 text-slate-800 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Assessment Submitted
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Thanks for attempting! All proctoring and monitoring sessions have been automatically terminated.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Proctoring Disengaged
          </div>
        </div>
      </div>
    );
  }

  if (isStarted) {
    return <MCQPage quizName="Random Quiz" onSubmit={handleQuizSubmit} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-2xl">
        
        {/* Top Header & Progress Indicator */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Proctored Environment Check
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Readiness Setup
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete the mandatory checks below before entering the assessment lobby.
            </p>
          </div>

          {/* Live Timer Pill */}
          <div className="self-start sm:self-auto flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs">
              <span className="text-slate-400 block font-medium">Window Closes In</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Global Error Banner (if any) */}
          {errorMessage && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3.5 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs sm:text-sm text-red-700 font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>
          )}

          {/* STEP 1: Camera Configuration */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 max-w-md">
                {/* Step Number / Checkmark Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    cameraStatus === "granted"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {cameraStatus === "granted" ? "✓" : "1"}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Configure Camera
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        cameraStatus === "granted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : cameraStatus === "denied"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {cameraStatus === "granted"
                        ? "Verified"
                        : cameraStatus === "denied"
                        ? "Failed"
                        : "Required"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Continuous video proctoring is required during the contest. Ensure your face is clearly visible and well-lit.
                  </p>

                  <button
                    type="button"
                    onClick={getCamera}
                    disabled={cameraStatus === "requesting"}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      cameraStatus === "granted"
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {cameraStatus === "requesting"
                      ? "Requesting Access..."
                      : cameraStatus === "granted"
                      ? "Refresh Camera Feed"
                      : "Get Camera Access"}
                  </button>
                </div>
              </div>

              {/* Camera Viewport Box */}
              <div className="relative w-full md:w-52 h-32 rounded-xl bg-slate-950 border border-slate-200 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={videoRef}
                  className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
                    cameraStatus === "granted" ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Fallback overlay when camera is off */}
                {cameraStatus !== "granted" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <svg className="w-7 h-7 mb-1.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px] font-medium text-slate-400">
                      {cameraStatus === "requesting" ? "Starting camera..." : "No Video Feed"}
                    </span>
                  </div>
                )}

                {/* Live Recording Badge */}
                {cameraStatus === "granted" && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/65 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white tracking-wider uppercase">
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="h-px bg-slate-100" />

          {/* STEP 2: Full Screen Permission */}
          <div className="p-6 sm:p-8 bg-slate-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 max-w-md">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isFullScreen
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {isFullScreen ? "✓" : "2"}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Full Screen Mode
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isFullScreen
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isFullScreen ? "Active" : "Required"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Exiting full-screen or switching tabs during the quiz may be flagged as a violation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFullScreen}
                className={`self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isFullScreen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {isFullScreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
                {isFullScreen ? "Full Screen Active" : "Enable Full Screen"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isReadyToStart ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isReadyToStart ? (
              <span className="font-medium text-emerald-700">
                All system checks passed! You are ready to begin.
              </span>
            ) : (
              <span>
                Complete <strong>both steps above</strong> to unlock the test button.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!isReadyToStart}
            onClick={() => {
              if (window.electronAPI && window.electronAPI.startTest) {
                window.electronAPI.startTest();
              }
              setIsStarted(true);
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              isReadyToStart
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            <span>Go To Test</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
