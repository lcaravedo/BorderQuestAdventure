import React, { useEffect, useState } from 'react';

// Component to add pause functionality to the game
export default function PauseControl({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);
  
  // Set up keyboard controls for pausing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle pause when Enter or P key is pressed
      if (e.code === 'Enter' || e.code === 'KeyP') {
        setIsPaused(prevPaused => !prevPaused);
        console.log("Game paused:", !isPaused);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused]);
  
  // Render pause overlay if game is paused
  return (
    <div className="pause-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      
      {isPaused && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <h1 style={{ color: '#fff', marginBottom: '20px' }}>PAUSED</h1>
          <p style={{ color: '#fff' }}>Press ENTER or P to resume</p>
        </div>
      )}
      
      {/* Pause hint at bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '5px 10px',
          borderRadius: '4px',
          zIndex: 999
        }}
      >
        <span style={{ color: '#fff', fontSize: '12px' }}>
          ENTER or P to pause
        </span>
      </div>
    </div>
  );
}