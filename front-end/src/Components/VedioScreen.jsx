import React from 'react';

const VedioScreen = ({ videoRef, label, isBlank = false }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3 w-full h-full">
      <div className="flex justify-between items-center">
        <h3 className="m-0 text-base font-semibold text-gray-700">
            {label}
        </h3>
        {!isBlank && (
            <span className="h-2 w-2 bg-green-500 rounded-full inline-block animate-pulse" />
        )}
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
        
        {/* Render placeholder if blank */}
        {isBlank && (
             <div className="text-gray-400 text-sm">
                Waiting for source...
            </div>
        )}

        {/* ALWAYS render video element if NOT blank, but hide it if needed */}
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isBlank ? 'hidden' : 'block'}`}
        />
        
      </div>
    </div>
  );
};

export default VedioScreen;