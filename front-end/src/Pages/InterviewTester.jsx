import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const InterviewTester = () => {
    const navigate = useNavigate();
    const [steps, setSteps] = useState({
        internet: { status: 'pending', msg: 'Waiting...' }, // pending, success, fail
        microphone: { status: 'pending', msg: 'Waiting...' },
        screen: { status: 'pending', msg: 'Waiting...' },
        camera: { status: 'pending', msg: 'Waiting...' },
        aiCheck: { status: 'pending', msg: 'Waiting...' },
    });
    
    const [currentStep, setCurrentStep] = useState(0); // 0 to 4
    const videoRef = useRef(null);

    // 1. Internet Check
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

    // 2. Microphone Check
    const checkMicrophone = async () => {
        setSteps(prev => ({ ...prev, microphone: { status: 'loading', msg: 'Requesting access...' } }));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Simple check: if we got a stream, it exists.
            stream.getTracks().forEach(t => t.stop());
            setSteps(prev => ({ ...prev, microphone: { status: 'success', msg: 'Input detected' } }));
            return true;
        } catch (e) {
            setSteps(prev => ({ ...prev, microphone: { status: 'fail', msg: 'Access denied or not found' } }));
            return false;
        }
    };

    // 3. Screen Share Check
    const checkScreen = async () => {
        setSteps(prev => ({ ...prev, screen: { status: 'loading', msg: 'Please share your entire screen...' } }));
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            
            // Just check if we got it, then stop it immediately for this test
            // Note: In real interview, you keep it open. Here we just test capability.
            stream.getTracks().forEach(t => t.stop());

            setSteps(prev => ({ ...prev, screen: { status: 'success', msg: 'Screen sharing works' } }));
            return true;
        } catch (e) {
             setSteps(prev => ({ ...prev, screen: { status: 'fail', msg: 'Screen share cancelled/failed' } }));
             return false;
        }
    };

    // 4. Camera & AI Face Check
    const checkCameraAndFace = async () => {
        setSteps(prev => ({ ...prev, camera: { status: 'loading', msg: 'Accessing camera...' }, aiCheck: { status: 'pending', msg: 'Waiting for camera...' } }));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // Wait a moment for video to load
                await new Promise(r => setTimeout(r, 1000));
                
                setSteps(prev => ({ ...prev, camera: { status: 'success', msg: 'Camera working' }, aiCheck: { status: 'loading', msg: 'Verifying face position...' } }));

                // Capture Frame
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
                
                // Convert to blob and send to backend
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
                             // Fallback for demo if backend not ready
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
        if (await checkInternet()) {
            setCurrentStep(1);
            if (await checkMicrophone()) {
                setCurrentStep(2);
                if (await checkScreen()) {
                     setCurrentStep(3);
                     if (await checkCameraAndFace()) {
                         // All Passed
                         setTimeout(() => {
                             navigate('/interview');
                         }, 1000);
                     }
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">System Check</h1>
                
                <div className="space-y-4">
                    <StepItem label="1. Internet Connection" step={steps.internet} />
                    <StepItem label="2. Microphone Access" step={steps.microphone} />
                    <StepItem label="3. Screen Sharing Capabilty" step={steps.screen} />
                    <StepItem label="4. Camera Access" step={steps.camera} />
                    <StepItem label="5. AI Proctoring Calibration" step={steps.aiCheck} />
                </div>

                <div className="mt-8 bg-black rounded-lg overflow-hidden h-48 w-full relative flex items-center justify-center">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                    {!videoRef.current?.srcObject && <span className="text-gray-500 absolute">Camera Preview</span>}
                </div>

                <button 
                    onClick={runTests}
                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Start System Check
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