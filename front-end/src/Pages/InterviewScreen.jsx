import { useEffect, useRef, useState } from "react";
import VedioScreen from "../Components/VedioScreen";

const InterviewScreen = () => {
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);

  // 1. Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log("Requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        console.log("Camera access granted");
        
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      // Cleanup tracks
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
         const tracks = cameraVideoRef.current.srcObject.getTracks();
         tracks.forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  // 2. Function to Start Screen Share
  const handleStartScreenShare = async () => {
    try {
      console.log("Requesting screen share...");
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false
      });
      
      console.log("Screen share granted");

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        setIsScreenActive(true);
      }
      
      // Handle "Stop Sharing" native browser button
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenActive(false);
        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }
      };
      
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 font-sans">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Technical Interview</h1>
        <p className="text-gray-600">Session ID: #882103</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
        
        {/* Card 1: Interviewer (Blank for now) */}
        <div className="min-h-[300px]">
            <VedioScreen 
                label="Interviewer (AI)" 
                isBlank={true} 
            />
        </div>

        {/* Card 2: User Camera */}
        <div className="min-h-[300px]">
            <VedioScreen 
                videoRef={cameraVideoRef} 
                label="Your Camera" 
                isBlank={!isCameraActive} 
            />
        </div>

        {/* Card 3: Screen Share */}
        <div className="min-h-[300px] flex flex-col gap-4">
            <VedioScreen 
                videoRef={screenVideoRef} 
                label="Your Screen" 
                isBlank={!isScreenActive} 
            />
            
            {!isScreenActive && (
                <button 
                    onClick={handleStartScreenShare}
                    className="py-3 px-5 bg-blue-600 text-white border-0 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700 w-full"
                >
                    Start Screen Share
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default InterviewScreen;