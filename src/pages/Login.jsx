import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isResetMode) {
      if (!email) {
        setError('Please enter your email address to reset your password.');
        return;
      }
      setIsSubmitting(true);
      try {
        await resetPassword(email);
        setResetSent(true);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const userRole = await login(email, password);
      setIsSubmitting(false);
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
      <div className="glass-panel reveal active" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <i className="fa-solid fa-user-astronaut" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your learning journey.</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}
        {resetSent && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Password reset email sent! Check your inbox.</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
              placeholder="Enter your email"
            />
          </div>
          
          {!isResetMode && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                placeholder="Enter your password"
              />
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <span 
                  onClick={() => { setIsResetMode(true); setError(''); setResetSent(false); }} 
                  style={{ color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Forgot Password?
                </span>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '12px', marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> {isResetMode ? 'Sending...' : 'Signing In...'}</>
            ) : (
              isResetMode ? 'Send Reset Link' : 'Sign In'
            )}
          </button>
          
          {isResetMode && (
            <div style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
              <span 
                onClick={() => { setIsResetMode(false); setError(''); setResetSent(false); }} 
                style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Back to Login
              </span>
            </div>
          )}
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
