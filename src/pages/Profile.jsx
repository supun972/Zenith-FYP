import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  useEffect(() => {
    if (user?.uid && user.role === 'student') {
      const q = query(collection(db, 'quiz_results'), where('studentId', '==', user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });
        results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setRecentQuizzes(results.slice(-7)); // Last 7 sessions
      });
      return () => unsub();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '40px' }}>
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--primary)' }}>
             <i className={`fa-solid ${user.role === 'teacher' ? 'fa-chalkboard-user' : 'fa-user-graduate'}`} style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
          </div>
          <div>
            <h1 style={{ margin: '0 0 10px 0' }}>{user.name}</h1>
            <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
              <span><i className="fa-solid fa-envelope"></i> {user.email}</span>
              <span style={{ textTransform: 'capitalize' }}><i className="fa-solid fa-id-badge"></i> {user.role}</span>
              {user.role === 'teacher' && user.teacherId && (
                <span style={{ textTransform: 'uppercase', color: 'var(--secondary)' }}><i className="fa-solid fa-hashtag"></i> {user.teacherId}</span>
              )}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Account Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Notifications</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 15px 0', fontSize: '0.9rem' }}>Manage your email and platform alerts.</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Receive daily summary emails
            </label>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Privacy Settings</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 15px 0', fontSize: '0.9rem' }}>Control how your focus data is shared.</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={user.role === 'student'} disabled={user.role === 'teacher'} /> Allow teacher to view detailed engagement metrics
            </label>
          </div>
        </div>

        {user.role === 'student' && (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', marginTop: '40px' }}>Engagement & Focus Trend</h2>
            <div className="glass-panel" style={{ padding: '30px', background: 'rgba(0,0,0,0.2)' }}>
              {recentQuizzes.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  Complete a study session to see your focus trend!
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                     {recentQuizzes.map((quiz, i) => {
                        const score = quiz.averageFocus || 100;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'flex-end', position: 'relative' }} title={`Topic: ${quiz.sessionTopic || 'Session'}\nFocus: ${score}%\nQuiz Score: ${quiz.score || 0}%`}>
                            <div style={{ position: 'absolute', top: '-25px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quiz.score || 0}%</div>
                            <div style={{ width: '100%', background: score >= 80 ? 'linear-gradient(to top, var(--primary), var(--secondary))' : 'rgba(245, 158, 11, 0.8)', height: `${score}%`, borderRadius: '6px 6px 0 0', opacity: 0.9, transition: 'height 1s ease-out' }}></div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>S{i+1}</span>
                          </div>
                        );
                     })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <span>Last {recentQuizzes.length} Sessions (Focus %)</span>
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Hover bars for details</span>
                  </div>
                </>
              )}
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', marginTop: '40px' }}>Completed Quizzes</h2>
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recentQuizzes.length === 0 ? (
                 <div style={{ color: 'var(--text-muted)' }}>No completed quizzes yet.</div>
              ) : (
                 recentQuizzes.slice().reverse().map(quiz => (
                   <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                     <div>
                       <h4 style={{ margin: '0 0 5px 0' }}>{quiz.sessionTopic || quiz.quizTitle}</h4>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(quiz.timestamp).toLocaleDateString()}</div>
                     </div>
                     <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: quiz.score >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                       {quiz.score}%
                     </div>
                   </div>
                 ))
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
