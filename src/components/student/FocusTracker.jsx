import React from 'react';
import Webcam from 'react-webcam';

const FocusTracker = ({ 
  modelsLoaded, modelError, focusScore, currentEmotion, 
  isCameraActive, handleUserMedia, handleUserMediaError, webcamRef 
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', flexShrink: 0 }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <i className="fa-solid fa-eye" style={{ color: 'var(--secondary)' }}></i> Live Focus Tracker
      </h3>
      
      <div style={{ fontSize: '0.7rem', color: modelsLoaded ? 'var(--success)' : (modelError ? 'var(--danger)' : 'var(--warning)'), marginBottom: '15px' }}>
         {modelsLoaded ? 'AI Engine Ready' : (modelError ? 'AI Engine Failed' : 'Loading AI Models...')}
      </div>

      <div style={{ width: '150px', height: '150px', margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: `4px solid ${focusScore > 80 ? 'var(--success)' : (focusScore > 50 ? 'var(--warning)' : 'var(--danger)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: isCameraActive ? '0 0 20px rgba(124, 58, 237, 0.4)' : 'none', transition: 'border-color 0.3s ease' }}>
        
        <Webcam
          audio={false}
          ref={webcamRef}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          mirrored={true}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: isCameraActive ? 1 : 0
          }}
        />

        {!isCameraActive && (
          <div style={{ position: 'absolute', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-video-slash" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
            <span style={{ fontSize: '0.7rem' }}>Camera Off</span>
          </div>
        )}

        {isCameraActive && modelsLoaded && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--secondary)', boxShadow: '0 0 10px var(--secondary)', animation: 'scan 1.5s infinite linear', zIndex: 10 }}></div>
        )}
      </div>
      
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: focusScore > 80 ? 'var(--success)' : (focusScore > 50 ? 'var(--warning)' : 'var(--danger)') }}>
        {focusScore}%
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Current Engagement Level</p>
      
      {isCameraActive && (
        <div style={{ marginTop: '10px', fontSize: '1rem', textTransform: 'capitalize', color: currentEmotion === 'happy' ? 'var(--success)' : (['sad', 'angry', 'fearful', 'disgusted'].includes(currentEmotion) ? 'var(--danger)' : 'var(--text)') }}>
          <i className={`fa-solid ${currentEmotion === 'happy' ? 'fa-smile' : (['sad', 'angry', 'fearful', 'disgusted'].includes(currentEmotion) ? 'fa-frown' : 'fa-meh')}`} style={{ marginRight: '8px' }}></i>
          Emotion: {currentEmotion}
        </div>
      )}
      
      {focusScore < 80 && isCameraActive && (
        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fcd34d', fontSize: '0.85rem', animation: 'fadeIn 0.3s ease' }}>
          <i className="fa-solid fa-bell"></i> It looks like you're getting distracted. Try to refocus!
        </div>
      )}
      
      {!isCameraActive && (
         <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
         <i className="fa-solid fa-triangle-exclamation"></i> Camera access is required to track focus!
       </div>
      )}
    </div>
  );
};

export default FocusTracker;
