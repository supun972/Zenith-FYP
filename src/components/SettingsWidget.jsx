import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const SettingsWidget = () => {
  const { theme, toggleTheme, animationsEnabled, toggleAnimations } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const makeMeAdmin = async () => {
    if (!user) return toast.error("Please login first!");
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
      // Update local storage manually just in case
      const cached = localStorage.getItem(`zenith_user_${user.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.role = 'admin';
        localStorage.setItem(`zenith_user_${user.uid}`, JSON.stringify(parsed));
      }
      toast.success("You are now an Admin! Reloading...");
      setTimeout(() => window.location.href = '/admin', 1000);
    } catch (e) {
      toast.error("Failed to make you admin: " + e.message);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 10000 }}>
      {isOpen && (
        <div className="glass-panel" style={{ 
          position: 'absolute', 
          bottom: '60px', 
          left: '0', 
          width: '250px', 
          padding: '20px', 
          borderRadius: '16px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-sliders"></i> Settings
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Theme</span>
            <button 
              onClick={toggleTheme}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {theme === 'dark' ? <><i className="fa-solid fa-moon"></i> Dark</> : <><i className="fa-solid fa-sun"></i> Light</>}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>3D Effects</span>
            <div 
              onClick={toggleAnimations}
              style={{
                width: '40px',
                height: '22px',
                background: animationsEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                borderRadius: '11px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: animationsEnabled ? '20px' : '2px',
                width: '18px',
                height: '18px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}></div>
            </div>
          </div>
          
          {user && user.role !== 'admin' && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={makeMeAdmin}
                style={{
                  width: '100%',
                  background: 'linear-gradient(45deg, var(--accent), var(--primary))',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                <i className="fa-solid fa-crown"></i> FYP Admin Demo
              </button>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
      >
        <i className="fa-solid fa-gear"></i>
      </button>
    </div>
  );
};

export default SettingsWidget;
