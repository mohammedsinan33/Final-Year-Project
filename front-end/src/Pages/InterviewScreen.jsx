import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Conversation } from "@11labs/client";
import InterviewReview from "../Components/InterviewReview";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cameraRef = useRef(null);
  const conversationRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordedAudio, setRecordedAudio] = useState(null);

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
  const [showReview, setShowReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const aiAvatar = "https://img.freepik.com/free-vector/chatbot-artificial-intelligence-concept_23-2148180470.jpg";

  useEffect(() => {
    localStorage.setItem("activeProctorSessionId", sessionIdRef.current);
    localStorage.setItem(reportKeyRef.current, JSON.stringify([]));
  }, []);

  const endInterview = async (reason = "") => {
    // Stop recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    // Close ElevenLabs conversation
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

    setShowReview(true);
  };

  const handleSkipReview = () => {
    navigate("/");
  };

  const handleSubmitReview = async (reviewData) => {
    setIsSubmittingReview(true);
    try {
      const appId = searchParams.get("app_id");
      
      const formData = new FormData();
      formData.append("application_id", appId);
      formData.append("session_id", sessionIdRef.current);
      formData.append("rating", reviewData.rating);
      formData.append("feedback", reviewData.feedback);
      
      if (recordedAudio) {
        formData.append("audio", recordedAudio, "interview.webm");
      }
      
      console.log("📤 Submitting review to backend...");
      const response = await fetch(`${API_BASE_URL}/interview/submit-review`, {
        method: "POST",
        body: formData
      });
      
      console.log("📥 Response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        
        // LOG THE FULL RESPONSE
        console.log("✅ Review submitted successfully");
        console.log("📋 Full response:", JSON.stringify(result, null, 2));
        console.log("📋 Final Report object:", result.final_report);
        console.log("📋 Final Report type:", typeof result.final_report);
        
        // Check if final_report exists
        if (!result.final_report) {
          console.warn("⚠️ final_report is:", result.final_report);
          alert("❌ Report generation failed or returned empty");
          navigate("/");
          return;
        }
        
        // Properly store the report as JSON
        const reportJSON = JSON.stringify(result.final_report, null, 2);
        localStorage.setItem("finalReport:" + sessionIdRef.current, reportJSON);
        console.log("✅ Stored report to localStorage");
        
        // Display the report nicely
        const eligibility = result.final_report?.eligibility?.status || "Unknown";
        const recommendation = result.final_report?.eligibility?.recommendation || "Pending";
        const overallScore = result.final_report?.scores?.overall || 0;
        
        const reportSummary = `
Interview Report Generated!

📊 Overall Score: ${overallScore}/100
✅ Eligibility Status: ${eligibility}
🎯 Recommendation: ${recommendation}

Position: ${result.final_report?.position || "Unknown"}
Date: ${result.final_report?.interview_date || "N/A"}

Database Saved: ${result.final_report?.database_saved ? "Yes" : "No"}

Click OK to continue to homepage.
      `;
      
        alert(reportSummary);
        
      } else {
        const error = await response.text();
        console.error("❌ Submit review error:", error);
        alert("Failed to submit review:\n" + error);
      }

      navigate("/");
    } catch (error) {
      console.error("❌ Submit error:", error);
      alert("Error submitting review:\n" + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
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
      if (hasStarted && !inFs && !showReview) {
        endInterview("Candidate exited fullscreen during interview");
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [hasStarted, showReview]);

  // Start interview services only after fullscreen is accepted.
  useEffect(() => {
    if (!hasStarted || showReview) return;

    let isMounted = true;

    const initInterview = async () => {
      try {
        const appId = searchParams.get("app_id");
        
        let requestBody = {
          application_id: appId
        };
        
        if (!appId) {
          const contextData = JSON.parse(localStorage.getItem("interviewContext") || "{}");
          requestBody.repo_analysis = contextData.repo_analysis;
          requestBody.resume_analysis = contextData.resume_analysis;
        }

        const response = await fetch(`${API_BASE_URL}/interview/prepare-interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend Error (${response.status}): ${errorText}`);
        }

        const { agent_id, context, session_id } = await response.json();
        const agentId = agent_id;           // ✅ Use top-level agent_id
        const dynamicPrompt = context;      // ✅ Use top-level context (already the full prompt)
        const backendSessionId = session_id; // ✅ Use top-level session_id

        if (!agentId || !dynamicPrompt || !isMounted) return;

        if (backendSessionId) {
          sessionIdRef.current = backendSessionId;
          reportKeyRef.current = "proctorReport:" + backendSessionId;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isMounted) return;

        if (conversationRef.current) {
          const old = conversationRef.current;
          conversationRef.current = null;
          await old.endSession().catch(() => {});
        }

        console.log("🔄 Starting ElevenLabs conversation...");
        console.log("   Agent ID:", agentId);
        console.log("   Prompt length:", dynamicPrompt.length);

        try {
          const conversation = await Conversation.startSession({
            agentId: agentId,
            onConnect: () => {
              console.log("✅ ElevenLabs conversation connected!");
              if (isMounted) {
                setIsConnecting(false);
                setIsInterviewActive(true);
              }
            },
            onDisconnect: () => {
              console.log("⚠️ ElevenLabs disconnected");
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
                localStorage.setItem("interviewTranscript:" + sessionIdRef.current, JSON.stringify(next));
                return next;
              });

              fetch(API_BASE_URL + "/interview/session/turn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_id: sessionIdRef.current,
                  role,
                  text
                })
              }).catch(() => {});
            },
            onError: (error) => {
              console.error("❌ ElevenLabs ERROR:", error);
              const errorStr = typeof error === "string" ? error : error?.message || "";
              if (!errorStr.toLowerCase().includes("closing") && isMounted) {
                alert("Interview error: " + errorStr);
              }
            }
          });

          console.log("✅ Conversation session created successfully");
          if (isMounted) conversationRef.current = conversation;
        } catch (error) {
          console.error("❌ Failed to start session:", error);
          throw error;
        }
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
  }, [hasStarted, showReview]);

  useEffect(() => {
    if (!hasStarted || showReview) return;

    const initCamera = async () => {
      const screenChecked = localStorage.getItem("screenShareChecked") === "true";
      if (!screenChecked) {
        alert("Please complete system check first.");
        navigate("/tester");
        return;
      }

      localStorage.removeItem("screenShareChecked");

      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (cameraRef.current) {
          cameraRef.current.srcObject = camStream;
        }
        
        // Auto-start recording
        startAudioRecording(camStream);
        
      } catch {
        alert("Camera/Microphone access is MANDATORY");
      }
    };

    initCamera();
  }, [hasStarted, showReview, navigate]);

  useEffect(() => {
    if (!hasStarted || showReview) return;

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
  }, [hasStarted, showReview]);

  const startAudioRecording = (stream) => {
    try {
      // Prevent double-starting
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("⚠️ Recording already in progress");
        return;
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("No audio tracks available for recording");
        return;
      }

      const audioStream = new MediaStream(audioTracks);
      const mediaRecorder = new MediaRecorder(audioStream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedAudio(audioBlob);
        audioChunksRef.current = []; // Reset for next recording
        console.log("✅ Interview audio recorded:", audioBlob.size, "bytes");
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      console.log("🎙️ Audio recording started");
    } catch (error) {
      console.error("Failed to start audio recording:", error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !cameraRef.current.srcObject) return;

    try {
      const stream = cameraRef.current.srcObject;
      let mediaRecorder = mediaRecorderRef.current;  // ← Change const to let

      if (!mediaRecorder) {
        const options = { mimeType: "audio/webm" };
        mediaRecorder = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = mediaRecorder;
      }

      mediaRecorder.start();

      audioChunksRef.current = [];
      setRecordedAudio(null);

      console.log("Recording started...");
    } catch (e) {
      console.error("Failed to start recording:", e);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    audioChunksRef.current = [];
    setRecordedAudio(null);

    console.log("Recording stopped...");
  };

  const handleRecordedAudio = async (audioBlob) => {
    if (!audioBlob) return;
    setRecordedAudio(audioBlob);
  };

  if (showReview) {
    return (
      <InterviewReview
        onSkip={handleSkipReview}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
      />
    );
  }

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

      <button
        onClick={startRecording}
        className="absolute bottom-4 left-4 bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 cursor-pointer"
      >
        Start Recording
      </button>

      <button
        onClick={stopRecording}
        className="absolute bottom-4 right-4 bg-red-600 px-4 py-2 rounded text-white font-semibold hover:bg-red-700 cursor-pointer"
      >
        Stop Recording
      </button>

      {recordedAudio && (
        <div className="absolute bottom-4 left-4 bg-blue-600/90 text-white p-3 rounded-lg max-w-xs">
          <strong className="block text-sm">Recorded Audio</strong>
          <span className="text-xs">{recordedAudio.size} bytes</span>
        </div>
      )}

    </div>
  );
};

export default InterviewScreen;