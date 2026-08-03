import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'teacher') {
      const idRegex = /^TCH-\d{4}$/;
      if (!idRegex.test(teacherId.toUpperCase())) {
        setError('Invalid Teacher ID format. Please use format like TCH-1234');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await signup(email, password, name, role, teacherId.toUpperCase());
      setIsSubmitting(false);
      if (role === 'teacher') {
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
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px', paddingBottom: '50px' }}>
      <div className="glass-panel reveal active" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <i className="fa-solid fa-user-plus" style={{ fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '1rem' }}></i>
          <h2>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Join ZENITH and transform your educational experience.</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
          <button 
            type="button"
            onClick={() => setRole('student')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '8px', 
              background: role === 'student' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${role === 'student' ? 'var(--primary)' : 'transparent'}`,
              color: role === 'student' ? 'var(--primary)' : 'var(--text-main)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
            <i className="fa-solid fa-user-graduate" style={{ fontSize: '1.5rem' }}></i>
            Student
          </button>
          <button 
            type="button"
            onClick={() => setRole('teacher')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '8px', 
              background: role === 'teacher' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${role === 'teacher' ? 'var(--secondary)' : 'transparent'}`,
              color: role === 'teacher' ? 'var(--secondary)' : 'var(--text-main)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
            <i className="fa-solid fa-chalkboard-user" style={{ fontSize: '1.5rem' }}></i>
            Teacher
          </button>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
          {role === 'student' && (
             <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Class Code (Optional)</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                  placeholder="Enter 6-digit code from your teacher"
                />
             </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>First Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                placeholder="John"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Last Name</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                placeholder="Doe"
              />
            </div>
          </div>

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
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
              placeholder="Create a strong password"
            />
          </div>

          {role === 'teacher' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>School / Institution</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                  placeholder="Where do you teach?"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 'bold' }}>
                  Official Teacher ID <i className="fa-solid fa-id-card" style={{ marginLeft: '5px' }}></i>
                </label>
                <input 
                  type="text" 
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid var(--secondary)', color: 'white', outline: 'none', textTransform: 'uppercase' }} 
                  placeholder="e.g. TCH-1234"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>Must be formatted as TCH- followed by 4 digits.</p>
              </div>
            </>
          )}
          
          <button type="submit" disabled={isSubmitting} className={`btn ${role === 'teacher' ? 'btn-secondary' : 'btn-primary'}`} style={{ width: '100%', padding: '12px', marginTop: '1rem', border: role === 'teacher' ? '1px solid var(--secondary)' : 'none', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
