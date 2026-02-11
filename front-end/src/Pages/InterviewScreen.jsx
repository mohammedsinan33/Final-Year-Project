import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewScreen = () => {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [malpractices, setMalpractices] = useState([]);

  // Mock AI Interviewer Image (Replace with video later)
  const aiAvatar = "https://img.freepik.com/free-vector/chatbot-artificial-intelligence-concept_23-2148180470.jpg"; 

  // 1. Start Camera & Screen Share immediately (assuming they passed tester)
  useEffect(() => {
    const initSession = async () => {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cameraRef.current) cameraRef.current.srcObject = camStream;
        
        // Force Screen Share again for the actual interview
        try {
            await navigator.mediaDevices.getDisplayMedia({ video: true });
        } catch(e) {
            alert("Screen share is MANDATORY. Redirecting...");
            navigate('/');
        }
    };
    initSession();
    
    // Cleanup
    return () => {
        // Stop tracks logic...
    };
  }, [navigate]);

  // 2. Proctoring Loop (Every 5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
       if (cameraRef.current) {
           const canvas = document.createElement('canvas');
           canvas.width = 640;
           canvas.height = 480;
           canvas.getContext('2d').drawImage(cameraRef.current, 0, 0);
           
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
                       
                       // Store in localStorage for report page
                       const existing = JSON.parse(localStorage.getItem('proctorReport') || "[]");
                       existing.push(newAlert);
                       localStorage.setItem('proctorReport', JSON.stringify(existing));
                   }
               } catch (e) {
                   console.error("Proctor loop failed", e);
               }
           }, 'image/jpeg');
       }
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  const endInterview = () => {
      navigate('/proctored-report');
  };

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="absolute top-0 w-full z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-center text-white">
          <h1 className="text-xl font-bold">AI Interview Session</h1>
          <button onClick={endInterview} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">End Interview</button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex ${isExpanded ? 'flex-row' : 'flex-col'} h-full transition-all duration-300`}>
          
          {/* 1. AI Interviewer Area */}
          <div className={`relative ${isExpanded ? 'w-1/2' : 'w-full'} h-full bg-black flex items-center justify-center transition-all`}>
              <img src={aiAvatar} alt="AI" className="max-h-full max-w-full opacity-80" />
              <div className="absolute bottom-10 text-white text-center w-full">
                  <p className="bg-black/50 inline-block px-4 py-2 rounded-full">AI is listening...</p>
              </div>
          </div>

          {/* 2. User Video Area */}
          <div 
            className={`
                transition-all duration-300 bg-gray-800 relative
                ${isExpanded 
                    ? 'w-1/2 h-full border-l border-gray-700'  // Split Mode
                    : 'absolute bottom-4 right-4 w-64 h-48 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden hover:scale-105' // Pip Mode
                }
            `}
          >
              <video ref={cameraRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded hover:bg-black/80 text-xs z-20"
              >
                  {isExpanded ? 'Minimize' : 'Expand'}
              </button>
          </div>
      </div>

      {/* Real-time Alerts */}
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