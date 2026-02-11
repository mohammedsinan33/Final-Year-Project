import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Conversation } from "@11labs/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewScreen = () => {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const conversationRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [malpractices, setMalpractices] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [transcript, setTranscript] = useState([]);

  const aiAvatar = "https://img.freepik.com/free-vector/chatbot-artificial-intelligence-concept_23-2148180470.jpg";

  useEffect(() => {
    let isMounted = true;
    
    const initInterview = async () => {
      try {
        console.log("🔄 Preparing interview context...");
        
        const contextData = JSON.parse(localStorage.getItem('interviewContext') || '{}');
        
        // Backend updates the agent with the custom prompt
        const response = await fetch(`${API_BASE_URL}/interview/prepare-interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend Error (${response.status}): ${errorText}`);
        }
        
        const { agent_id, success } = await response.json();
        
        console.log("✅ Agent prepared:", agent_id);
        console.log("Prompt update success:", success);
        
        if (!agent_id) throw new Error("Agent ID missing");
        if (!isMounted) return;
        
        // Give ElevenLabs a moment to process the agent update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("🎤 Starting ElevenLabs session...");

        // Simple connection - no overrides (agent is already configured)
        const conversation = await Conversation.startSession({
          agentId: agent_id,
          
          onConnect: () => {
            console.log("✅ Connected to ElevenLabs");
            if (isMounted) {
              setIsConnecting(false);
              setIsInterviewActive(true);
            }
          },
          
          onDisconnect: () => {
            console.log("❌ Disconnected");
            if (isMounted) {
              setIsInterviewActive(false);
            }
          },
          
          onMessage: (message) => {
            console.log("📩 Message:", message);
            if (!isMounted) return;
            
            // Capture agent messages
            if (message.source === "ai" || message.role === "assistant") {
              setTranscript(prev => [...prev, { role: 'agent', text: message.message }]);
            }
          },
          
          onError: (error) => {
            console.error("⚠️ Error:", error);
            if (!isMounted) return;
            
            const errorStr = typeof error === 'string' ? error : error?.message || '';
            if (errorStr.toLowerCase().includes('closing')) return;
            
            alert("Interview error: " + errorStr);
          }
        });
        
        console.log("✅ Session created");
        
        if (isMounted) {
          conversationRef.current = conversation;
        } else {
          conversation.endSession().catch(() => {});
        }
        
      } catch (error) {
        console.error("💥 Failed:", error);
        if (isMounted) {
          alert("Failed to start interview: " + error.message);
        }
      }
    };
    
    initInterview();
    
    return () => {
      console.log("🧹 Cleanup");
      isMounted = false;
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cameraRef.current) cameraRef.current.srcObject = camStream;
        await navigator.mediaDevices.getDisplayMedia({ video: true });
      } catch(e) {
        alert("Camera/Screen share is MANDATORY");
      }
    };
    initCamera();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (cameraRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(cameraRef.current, 0, 0);
            canvas.toBlob(async (blob) => {
              if(!blob) return;
              const formData = new FormData();
              formData.append('file', blob, 'capture.jpg');
    
              try {
                const res = await fetch(`${API_BASE_URL}/proctor/monitor`, { method: 'POST', body: formData });
                const data = await res.json();
                
                if (data.status === 'alert') {
                  const newAlert = { time: new Date().toLocaleTimeString(), issue: data.issue };
                  setMalpractices(prev => [...prev, newAlert]);
                  
                  const existing = JSON.parse(localStorage.getItem('proctorReport') || "[]");
                  existing.push(newAlert);
                  localStorage.setItem('proctorReport', JSON.stringify(existing));
                }
              } catch (e) {
                console.error("Proctor loop failed", e);
              }
            }, 'image/jpeg');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const endInterview = async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (err) {
        console.log("Session already closed");
      }
      conversationRef.current = null;
    }
    navigate('/proctored-report');
  };

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden flex flex-col">
      <div className="absolute top-0 w-full z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-center text-white">
        <h1 className="text-xl font-bold">AI Interview Session</h1>
        <div className="flex items-center gap-4">
          {isConnecting && <span className="text-yellow-400 animate-pulse">● Connecting...</span>}
          {isInterviewActive && <span className="text-green-400">● Live</span>}
          <button onClick={endInterview} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 cursor-pointer">End Interview</button>
        </div>
      </div>

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
    </div>
  );
};

export default InterviewScreen;