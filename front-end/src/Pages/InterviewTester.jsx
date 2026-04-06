import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Make sure this path matches your project structure

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewTester = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const appId = searchParams.get("app_id");

    // --- TIMING STATE ---
    const [loadingTime, setLoadingTime] = useState(true);
    const [timeStatus, setTimeStatus] = useState("checking"); // checking, early, late, valid, invalid_link
    const [scheduledDateTime, setScheduledDateTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState("");

    // --- SYSTEM CHECK STATE ---
    const [steps, setSteps] = useState({
        internet: { status: 'pending', msg: 'Waiting...' }, // pending, success, fail
        microphone: { status: 'pending', msg: 'Waiting...' },
        screen: { status: 'pending', msg: 'Waiting...' },
        camera: { status: 'pending', msg: 'Waiting...' },
        aiCheck: { status: 'pending', msg: 'Waiting...' },
    });
    
    const [currentStep, setCurrentStep] = useState(0); // 0 to 4
    const videoRef = useRef(null);

    // ==========================================
    // TIME VERIFICATION LOGIC
    // ==========================================
    useEffect(() => {
        const verifyInterviewTime = async () => {
            if (!appId) {
                setTimeStatus("invalid_link");
                setLoadingTime(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("job_applications")
                    .select("interview_scheduled_date")
                    .eq("id", appId)
                    .single();

                if (error || !data?.interview_scheduled_date) throw new Error();

                const scheduledTime = new Date(data.interview_scheduled_date);
                setScheduledDateTime(scheduledTime);
                checkTimeWindow(scheduledTime);

            } catch (err) {
                setTimeStatus("invalid_link");
                setLoadingTime(false);
            }
        };

        verifyInterviewTime();
    }, [appId]);

    // Live Countdown Timer
    useEffect(() => {
        if (!scheduledDateTime || timeStatus === 'late') return;

        const interval = setInterval(() => {
            checkTimeWindow(scheduledDateTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [scheduledDateTime, timeStatus]);

    const checkTimeWindow = (scheduledDate) => {
        const now = new Date();
        const diffMs = scheduledDate - now;
        
        // 15 minutes grace period allowing late entry
        const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
        
        if (diffMs > 0) {
            // Early
            setTimeStatus("early");
            
            // Format remaining time
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mm = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const ss = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            if (hours > 0) setTimeRemaining(`Opens in about ${hours} hour(s) and ${mm} mins`);
            else setTimeRemaining(`Starts in: ${mm}m ${ss}s`);
            
        } else if (Math.abs(diffMs) > FIFTEEN_MINUTES_MS) {
            // Late (exceeded 15 min grace period)
            setTimeStatus("late");
        } else {
            // Valid (Within valid timeframe)
            setTimeStatus("valid");
        }
        
        setLoadingTime(false);
    };

    // ==========================================
    // SYSTEM CHECK LOGIC (Unchanged from your original code)
    // ==========================================
    const checkInternet = async () => {
        setSteps(prev => ({ ...prev, internet: { status: 'loading', msg: 'Checking connectivity...' } }));
        try {
            const start = Date.now();
            await fetch(`${API_BASE_URL}/docs`); // Ping backend
            const latency = Date.now() - start;
            
            if (latency < 2000) {
                setSteps(prev => ({ ...prev, internet: { status: 'success', msg: `Stable (${latency}ms)` } }));
                return true;
            } else {
                setSteps(prev => ({ ...prev, internet: { status: 'warning', msg: `Slow (${latency}ms)` } }));
                return true; // Accept slow internet
            }
        } catch (e) {
            setSteps(prev => ({ ...prev, internet: { status: 'fail', msg: 'No connection to server' } }));
            return false;
        }
    };

    const checkMicrophone = async () => {
        setSteps(prev => ({ ...prev, microphone: { status: 'loading', msg: 'Requesting access...' } }));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            setSteps(prev => ({ ...prev, microphone: { status: 'success', msg: 'Input detected' } }));
            return true;
        } catch (e) {
            setSteps(prev => ({ ...prev, microphone: { status: 'fail', msg: 'Access denied or not found' } }));
            return false;
        }
    };

    const checkScreen = async () => {
        setSteps(prev => ({ ...prev, screen: { status: 'loading', msg: 'Please share your entire screen...' } }));
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());
            setSteps(prev => ({ ...prev, screen: { status: 'success', msg: 'Screen sharing works' } }));
            localStorage.setItem("screenShareChecked", "true");
            return true;
        } catch (e) {
             setSteps(prev => ({ ...prev, screen: { status: 'fail', msg: 'Screen share cancelled/failed' } }));
             return false;
        }
    };

    const checkCameraAndFace = async () => {
        setSteps(prev => ({ ...prev, camera: { status: 'loading', msg: 'Accessing camera...' }, aiCheck: { status: 'pending', msg: 'Waiting for camera...' } }));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                await new Promise(r => setTimeout(r, 1000));
                
                setSteps(prev => ({ ...prev, camera: { status: 'success', msg: 'Camera working' }, aiCheck: { status: 'loading', msg: 'Verifying face position...' } }));

                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
                
                return new Promise((resolve) => {
                    canvas.toBlob(async (blob) => {
                        const formData = new FormData();
                        formData.append('file', blob, 'check.jpg');

                        try {
                            const res = await fetch(`${API_BASE_URL}/proctor/initial-check`, {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            
                            if (data.status === 'ok') {
                                setSteps(prev => ({ ...prev, aiCheck: { status: 'success', msg: 'Face detected & centered' } }));
                                resolve(true);
                            } else {
                                setSteps(prev => ({ ...prev, aiCheck: { status: 'fail', msg: data.detail || 'Face not visible or centered' } }));
                                resolve(false);
                            }
                        } catch (err) {
                             setSteps(prev => ({ ...prev, aiCheck: { status: 'warning', msg: 'AI Backend offline (Bypassed)' } }));
                             resolve(true); 
                        }
                    }, 'image/jpeg');
                });
            }
        } catch (e) {
             setSteps(prev => ({ ...prev, camera: { status: 'fail', msg: 'Camera failed' } }));
             return false;
        }
        return false;
    };

    const runTests = async () => {
        if (timeStatus !== 'valid') return;

        localStorage.removeItem("screenShareChecked");
        if (await checkInternet()) {
            setCurrentStep(1);
            if (await checkMicrophone()) {
                setCurrentStep(2);
                if (await checkScreen()) {
                     setCurrentStep(3);
                     if (await checkCameraAndFace()) {
                         setTimeout(() => {
                             // Pass the app_id forward so the actual interview page knows who is joining
                             navigate(`/interview?app_id=${appId}`); 
                         }, 1000);
                     }
                }
            }
        }
    };

    // ==========================================
    // RENDER LOGIC
    // ==========================================

    if (loadingTime) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6"><div className="text-xl font-semibold text-gray-700 animate-pulse">Verifying Interview Details...</div></div>;
    }

    if (timeStatus === 'invalid_link') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-xl shadow-lg border-t-4 border-red-500 max-w-lg w-full text-center">
                    <h1 className="text-4xl mb-4">⚠️</h1>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Interview Link</h2>
                    <p className="text-gray-700">We couldn't find a scheduled interview with this link. Make sure you used the exact link sent to your email.</p>
                </div>
            </div>
        );
    }

    // EARLY BLOCK
    if (timeStatus === 'early') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                 <div className="bg-white p-10 rounded-xl shadow-lg border-t-4 border-blue-500 max-w-lg w-full text-center">
                    <h1 className="text-5xl mb-4">⏳</h1>
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">You are early!</h2>
                    <p className="text-gray-600 mb-6 text-lg">Your interview is scheduled for <strong>{scheduledDateTime?.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</strong>. You can run the system checks and enter exactly when the time arrives.</p>
                    <div className="p-5 bg-blue-50 text-blue-800 rounded-lg font-mono text-2xl font-bold animate-pulse shadow-inner mb-4">
                        {timeRemaining}
                    </div>
                </div>
            </div>
        );
    }

    // LATE BLOCK (15+ Min)
    if (timeStatus === 'late') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                 <div className="bg-white p-10 rounded-xl shadow-lg border-t-4 border-red-600 max-w-lg w-full text-center">
                    <h1 className="text-5xl mb-4">❌</h1>
                    <h2 className="text-3xl font-bold mb-4 text-red-600">Interview Cancelled</h2>
                    <p className="text-gray-700 text-lg mb-4">You exceeded the maximum 15-minute grace period to join your interview room.</p>
                    <p className="text-sm rounded p-3 bg-gray-100 text-gray-500 font-semibold mb-4 border text-left">
                        Scheduled for: <br/>{scheduledDateTime?.toLocaleString()}
                    </p>
                    <p className="text-gray-500 italic text-sm">Please contact your recruiter if you need to reschedule.</p>
                </div>
            </div>
        );
    }

    // VALID BLOCK (Time is correct, show the exact same System Checks)
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full relative overflow-hidden">
                {/* Visual Indicator of open room */}
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>

                <div className="flex justify-between items-end mb-6 pt-2">
                    <h1 className="text-2xl font-bold text-gray-800">System Check</h1>
                    <span className="bg-green-100 border border-green-300 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Room Open
                    </span>
                </div>
                
                <div className="space-y-4">
                    <StepItem label="1. Internet Connection" step={steps.internet} />
                    <StepItem label="2. Microphone Access" step={steps.microphone} />
                    <StepItem label="3. Screen Sharing Capabilty" step={steps.screen} />
                    <StepItem label="4. Camera Access" step={steps.camera} />
                    <StepItem label="5. AI Proctoring Calibration" step={steps.aiCheck} />
                </div>

                <div className="mt-8 bg-black rounded-lg overflow-hidden h-48 w-full relative flex items-center justify-center">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                    {!videoRef.current?.srcObject && <span className="text-gray-500 absolute font-medium">Camera Preview</span>}
                </div>

                <button 
                    onClick={runTests}
                    className="mt-6 w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-[0.98] shadow-md transition-all"
                >
                    Start System Check & Enter Interview
                </button>
            </div>
        </div>
    );
};

const StepItem = ({ label, step }) => {
    let color = 'text-gray-500';
    let icon = '○';

    if (step.status === 'loading') { color = 'text-blue-500'; icon = '↻'; }
    if (step.status === 'success') { color = 'text-green-500'; icon = '✔'; }
    if (step.status === 'fail') { color = 'text-red-500'; icon = '✖'; }
    if (step.status === 'warning') { color = 'text-orange-500'; icon = '⚠'; }

    return (
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-medium text-gray-700">{label}</span>
            <div className={`flex items-center gap-2 ${color}`}>
                <span className="text-sm">{step.msg}</span>
                <span className="font-bold">{icon}</span>
            </div>
        </div>
    );
};

export default InterviewTester;