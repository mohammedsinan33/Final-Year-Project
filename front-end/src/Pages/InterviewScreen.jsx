import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Conversation } from "@11labs/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewScreen = () => {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const conversationRef = useRef(null);

  const sessionIdRef = useRef(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const reportKeyRef = useRef(`proctorReport:${sessionIdRef.current}`);

  const [isExpanded, setIsExpanded] = useState(false);
  const [malpractices, setMalpractices] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [isFsRequired, setIsFsRequired] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const aiAvatar = "https://img.freepik.com/free-vector/chatbot-artificial-intelligence-concept_23-2148180470.jpg";

  useEffect(() => {
    localStorage.setItem("activeProctorSessionId", sessionIdRef.current);
    localStorage.setItem(reportKeyRef.current, JSON.stringify([]));
  }, []);

  const endInterview = async (reason = "") => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        console.log("Session already closed");
      }
      conversationRef.current = null;
    }

    const finalAlerts = [...malpractices];
    if (reason) {
      finalAlerts.push({
        time: new Date().toLocaleTimeString(),
        issue: reason,
      });
    }

    localStorage.setItem(reportKeyRef.current, JSON.stringify(finalAlerts));
    localStorage.setItem("lastProctorSessionId", sessionIdRef.current);

    navigate(`/finalrport?sessionId=${encodeURIComponent(sessionIdRef.current)}`);
  };

  const enterFullscreenAndStart = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsFsRequired(false);
      setHasStarted(true);
    } catch (e) {
      alert("Fullscreen is mandatory to start the interview.");
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);

      // If interview has begun and user exits fullscreen, end immediately.
      if (hasStarted && !inFs) {
        endInterview("Candidate exited fullscreen during interview");
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [hasStarted]);

  // Start interview services only after fullscreen is accepted.
  useEffect(() => {
    if (!hasStarted) return;

    let isMounted = true;

    const initInterview = async () => {
      try {
        const contextData = JSON.parse(localStorage.getItem("interviewContext") || "{}");
        const response = await fetch(`${API_BASE_URL}/interview/prepare-interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contextData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend Error (${response.status}): ${errorText}`);
        }

        const { agent_id } = await response.json();
        if (!agent_id || !isMounted) return;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const conversation = await Conversation.startSession({
          agentId: agent_id,
          onConnect: () => {
            if (isMounted) {
              setIsConnecting(false);
              setIsInterviewActive(true);
            }
          },
          onDisconnect: () => {
            if (isMounted) setIsInterviewActive(false);
          },

          
          onMessage: (message) => {
            if (!isMounted) return;

            const roleRaw = (message?.source || message?.role || "").toLowerCase();
            const text = (message?.message || "").trim();
            if (!text) return;

            const role =
              roleRaw === "ai" || roleRaw === "assistant" ? "agent" : "candidate";

            setTranscript((prev) => {
              const next = [...prev, { role, text }];
              localStorage.setItem(`interviewTranscript:${sessionIdRef.current}`, JSON.stringify(next));
              return next;
            });

            fetch(`${API_BASE_URL}/interview/session/turn`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: sessionIdRef.current,
                role,
                text,
              }),
            }).catch(() => {});
          },
          onError: (error) => {
            const errorStr = typeof error === "string" ? error : error?.message || "";
            if (!errorStr.toLowerCase().includes("closing")) {
              alert("Interview error: " + errorStr);
            }
          },
        });

        if (isMounted) conversationRef.current = conversation;
      } catch (error) {
        if (isMounted) alert("Failed to start interview: " + error.message);
      }
    };

    initInterview();

    return () => {
      isMounted = false;
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const initCamera = async () => {
      const screenChecked = localStorage.getItem("screenShareChecked") === "true";
      if (!screenChecked) {
        alert("Please complete system check first.");
        navigate("/tester");
        return;
      }

      // consume once so user can't skip tester on future sessions
      localStorage.removeItem("screenShareChecked");

      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cameraRef.current) cameraRef.current.srcObject = camStream;
        // removed: await navigator.mediaDevices.getDisplayMedia({ video: true });
      } catch {
        alert("Camera/Microphone access is MANDATORY");
      }
    };

    initCamera();
  }, [hasStarted, navigate]);

  // Keep your existing proctor loop useEffect, but also guard with hasStarted.

  // ADD this missing monitor loop useEffect
  useEffect(() => {
    if (!hasStarted) return;

    const interval = setInterval(async () => {
      if (!cameraRef.current || !cameraRef.current.srcObject) return;

      const video = cameraRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("file", blob, "capture.jpg");
        formData.append("session_id", sessionIdRef.current);

        try {
          const res = await fetch(`${API_BASE_URL}/proctor/monitor`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) return;
          const data = await res.json();

          if (data.status === "alert") {
            const newAlert = {
              time: new Date().toLocaleTimeString(),
              issue: data.issue,
            };

            setMalpractices((prev) => {
              const next = [...prev, newAlert];
              localStorage.setItem(reportKeyRef.current, JSON.stringify(next));
              return next;
            });
          }
        } catch (e) {
          console.error("Proctor monitor failed:", e);
        }
      }, "image/jpeg", 0.8);
    }, 4000);

    return () => clearInterval(interval);
  }, [hasStarted]);

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden flex flex-col">
      {isFsRequired && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-gray-800 text-white rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold mb-3">Fullscreen Required</h2>
            <p className="text-sm text-gray-300 mb-6">
              You must stay in fullscreen during the interview. Exiting fullscreen will end the session.
            </p>
            <button
              onClick={enterFullscreenAndStart}
              className="bg-blue-600 px-5 py-3 rounded hover:bg-blue-700"
            >
              Enter Fullscreen and Start
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 flex ${isExpanded ? 'flex-row' : 'flex-col'} h-full transition-all duration-300`}>
        <div className={`relative ${isExpanded ? 'w-1/2' : 'w-full'} h-full bg-black flex items-center justify-center transition-all`}>
          <img src={aiAvatar} alt="AI" className="max-h-full max-w-full opacity-80" />
          <div className="absolute bottom-10 text-white text-center w-full px-4">
            <div className="bg-black/70 inline-block px-6 py-3 rounded-full">
              {isConnecting ? "Preparing interview..." : "AI is listening..."}
            </div>
            {transcript.length > 0 && (
              <div className="mt-4 bg-black/60 p-4 rounded max-w-2xl mx-auto">
                <p className="text-sm italic">{transcript[transcript.length - 1].text}</p>
              </div>
            )}
          </div>
        </div>

        <div 
          className={`transition-all duration-300 bg-gray-800 relative ${isExpanded ? 'w-1/2 h-full border-l border-gray-700' : 'absolute bottom-4 right-4 w-64 h-48 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden hover:scale-105'}`}
        >
          <video ref={cameraRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded hover:bg-black/80 text-xs z-20 cursor-pointer"
          >
            {isExpanded ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>

      {malpractices.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-red-500/90 text-white p-3 rounded-lg max-w-xs animate-bounce">
          <strong className="block text-sm">⚠️ Warning Issued</strong>
          <span className="text-xs">{malpractices[malpractices.length-1].issue}</span>
        </div>
      )}

      {hasStarted && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={() => endInterview()}
            className="bg-red-600 px-4 py-2 rounded text-white font-semibold hover:bg-red-700 cursor-pointer"
          >
            End Interview
          </button>
        </div>
      )}

    </div>
  );
};

export default InterviewScreen;