import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // Mock Real-time Feed
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    // Fetch Users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const u = [];
      snapshot.forEach(doc => u.push({ id: doc.id, ...doc.data() }));
      setUsers(u);
    });

    // Fetch Classes
    const qClasses = query(collection(db, 'classes'));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      const c = [];
      snapshot.forEach(doc => c.push({ id: doc.id, ...doc.data() }));
      setClasses(c);
    });

    // Fetch Study Sessions
    const qSessions = query(collection(db, 'study_sessions'));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const s = [];
      snapshot.forEach(doc => s.push({ id: doc.id, ...doc.data() }));
      // Sort naturally (Lesson 1, Lesson 2... Lesson 10)
      s.sort((a, b) => {
        if (!a.topic) return 1;
        if (!b.topic) return -1;
        return a.topic.localeCompare(b.topic, undefined, { numeric: true, sensitivity: 'base' });
      });
      setSessions(s);
    });

    // Fetch Quiz Results (for activity and graphs)
    const qQuizzes = query(collection(db, 'quiz_results'));
    const unsubQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      const qz = [];
      snapshot.forEach(doc => qz.push({ id: doc.id, ...doc.data() }));
      qz.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setQuizzes(qz);
      
      // Update Activity Feed
      const feed = qz.slice(0, 5).map(q => ({
        id: q.id,
        time: new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: `${q.studentName || 'A student'} completed quiz: ${q.quizTitle} with ${q.score}%`
      }));
      setActivityFeed(feed);
    });

    return () => {
      unsubUsers();
      unsubClasses();
      unsubSessions();
      unsubQuizzes();
    };
  }, []);

  const handleDeleteUser = async (uid) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        toast.success("User deleted.");
      } catch (e) {
        toast.error("Failed to delete user.");
      }
    }
  };

  const handleToggleRole = async (uid, currentRole) => {
    const newRole = currentRole === 'student' ? 'teacher' : 'student';
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      toast.success(`User role changed to ${newRole}`);
    } catch (e) {
      toast.error("Failed to update role.");
    }
  };
  
  const handleDeleteContent = async (collectionName, id) => {
    if (window.confirm(`Delete this ${collectionName}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        toast.success("Deleted successfully.");
      } catch (e) {
        toast.error("Delete failed.");
      }
    }
  }

  // Calculate stats
  const avgFocus = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + (q.averageFocus || 100), 0) / quizzes.length)
    : 100;

  // Compute Real User Growth Trend Data for the last 7 days
  const growthData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        endOfDay: d.getTime() + 24 * 60 * 60 * 1000 - 1
      });
    }

    return days.map(day => {
      const count = users.filter(u => {
        // If missing createdAt, pretend they joined today so they still show up in the current count
        const uTime = u.createdAt ? new Date(u.createdAt).getTime() : new Date().getTime();
        return uTime <= day.endOfDay;
      }).length;
      return {
        name: day.name,
        users: count
      };
    });
  }, [users]);

  return (
    <div style={{ padding: '120px 5% 50px 5%', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '20px', borderRadius: '16px', height: 'fit-content', position: 'sticky', top: '100px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '30px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-shield-halved"></i> Admin Portal
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <li>
            <button onClick={() => setActiveTab('overview')} style={{ width: '100%', textAlign: 'left', padding: '12px', background: activeTab === 'overview' ? 'rgba(124, 58, 237, 0.2)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', transition: '0.3s' }}>
              <i className="fa-solid fa-chart-line"></i> System Overview
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('users')} style={{ width: '100%', textAlign: 'left', padding: '12px', background: activeTab === 'users' ? 'rgba(124, 58, 237, 0.2)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'users' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', transition: '0.3s' }}>
              <i className="fa-solid fa-users"></i> User Management
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('content')} style={{ width: '100%', textAlign: 'left', padding: '12px', background: activeTab === 'content' ? 'rgba(124, 58, 237, 0.2)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'content' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', transition: '0.3s' }}>
              <i className="fa-solid fa-folder-open"></i> Content Control
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Platform Analytics</h1>
            
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderTop: '4px solid var(--primary)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Total Users</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{users.length}</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderTop: '4px solid var(--secondary)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Total Classes</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{classes.length}</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderTop: '4px solid var(--success)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Quizzes Taken</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{quizzes.length}</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderTop: '4px solid var(--accent)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Avg. Platform Focus</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{avgFocus}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {/* Chart */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>User Growth Trend</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: 'rgba(6,6,18,0.9)', border: '1px solid var(--primary)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="users" stroke="var(--primary)" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '320px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                  Live System Log
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activityFeed.map(log => (
                    <div key={log.id} style={{ fontSize: '0.85rem', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>[{log.time}]</span> {log.message}
                    </div>
                  ))}
                  {activityFeed.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No recent activity.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>User Management</h1>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '15px' }}>Name</th>
                    <th style={{ padding: '15px' }}>Email</th>
                    <th style={{ padding: '15px' }}>Role</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px' }}>{u.name || 'N/A'} {u.uid === user?.uid && <span style={{fontSize: '0.7rem', color: 'var(--primary)'}}>(You)</span>}</td>
                      <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ background: u.role === 'teacher' ? 'rgba(14,165,233,0.2)' : u.role === 'admin' ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)', color: u.role === 'teacher' ? 'var(--secondary)' : u.role === 'admin' ? 'var(--accent)' : 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {u.role || 'student'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                        {u.uid !== user?.uid && (
                          <>
                            <button onClick={() => handleToggleRole(u.id, u.role || 'student')} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Toggle Role</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}><i className="fa-solid fa-trash"></i></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Content Control</h1>
            
            <h3 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Global Study Sessions</h3>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
              {sessions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No sessions found.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sessions.map(s => (
                    <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem' }}>{s.topic}</strong> <span style={{ color: 'var(--primary)', fontSize: '0.85rem', marginLeft: '10px', background: 'rgba(124, 58, 237, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>{s.subject}</span>
                      </div>
                      <button onClick={() => handleDeleteContent('study_sessions', s.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}><i className="fa-solid fa-trash"></i> Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <h3 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Global Classes</h3>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              {classes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No classes found.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {classes.map(c => (
                    <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem' }}>{c.name}</strong> 
                        <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginLeft: '10px', background: 'rgba(14, 165, 233, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>CODE: {c.code}</span>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>Created by: {c.teacherName}</div>
                      </div>
                      <button onClick={() => handleDeleteContent('classes', c.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}><i className="fa-solid fa-trash"></i> Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
