import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDocs, deleteDoc, doc } from 'firebase/firestore';
import lessonsData from '../lessons_data.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [view, setView] = useState('overview'); // 'overview' | 'live-class' | 'reports'
  const [activeCode, setActiveCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [alerts] = useState([
    { id: 1, time: '10:02 AM', msg: 'Class session started' }
  ]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createdClasses, setCreatedClasses] = useState([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  
  // Real Quiz Results State
  const [quizResults, setQuizResults] = useState([]);
  
  // Classroom Chat State
  const [classroomMessages, setClassroomMessages] = useState([]);
  const [broadcastInput, setBroadcastInput] = useState('');

  // Study Session States
  const [isAssignSessionModalOpen, setIsAssignSessionModalOpen] = useState(false);
  const [sessionData, setSessionData] = useState({
    subject: '',
    topic: '',
    duration: 45,
    content: '',
    quizQuestion: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctOpt: 'A'
  });

  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData = [];
        snapshot.forEach((doc) => {
          classesData.push({ id: doc.id, ...doc.data() });
        });
        setCreatedClasses(classesData);
      });

      const qSessions = query(collection(db, 'study_sessions'), where('teacherId', '==', user.uid));
      const unsubSessions = onSnapshot(qSessions, (snapshot) => {
        const sessData = [];
        snapshot.forEach((doc) => {
          sessData.push({ id: doc.id, ...doc.data() });
        });
        setSessions(sessData);
      });

      return () => {
        unsubscribe();
        unsubSessions();
      };
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activeStuds = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const focus = data.focus !== undefined ? data.focus : 100;
        let status = 'active';
        if (focus < 50) status = 'distracted';
        else if (focus < 75) status = 'warning';
        
        activeStuds.push({ id: doc.id, name: data.name, focus, status, completedLessons: data.completedLessons || [] });
      });
      
      setStudents(activeStuds);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Quiz Results Globally for Predictive Analytics
  useEffect(() => {
    const q = query(collection(db, 'quiz_results'));
    const unsub = onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setQuizResults(results);
    });
    return () => unsub();
  }, []);

  // Fetch Classroom Messages
  useEffect(() => {
    if (view === 'live-class') {
      const q = query(collection(db, 'classroom_messages'));
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = [];
        snapshot.forEach(doc => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setClassroomMessages(msgs);
      });
      return () => unsub();
    }
  }, [view]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastInput.trim()) return;
    try {
      await addDoc(collection(db, 'classroom_messages'), {
        sender: 'Teacher',
        senderName: user?.name || 'Teacher',
        text: broadcastInput,
        timestamp: new Date().toISOString()
      });
      setBroadcastInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const avgFocus = Math.round(students.reduce((acc, curr) => acc + curr.focus, 0) / students.length) || 100;

  // Compute Real BarChart Data (Moved up to follow Rules of Hooks)
  const engagementChartData = useMemo(() => {
    const topics = {};
    quizResults.forEach(q => {
      const topic = q.quizTitle || 'Unknown Session';
      if (!topics[topic]) topics[topic] = { total: 0, count: 0 };
      topics[topic].total += (q.averageFocus || 100);
      topics[topic].count += 1;
    });

    const data = Object.keys(topics).map(topic => ({
      name: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
      engagement: Math.round(topics[topic].total / topics[topic].count)
    }));

    return data.length > 0 ? data : [
      { name: 'No Data Yet', engagement: 0 }
    ];
  }, [quizResults]);

  // --- AI Predictive Risk Analytics Engine ---
  const generatePredictiveInsights = () => {
    const insights = [];
    students.forEach(student => {
      const studentQuizzes = quizResults.filter(q => q.studentName === student.name || q.studentId === student.id);
      if (studentQuizzes.length > 0) {
        const sortedQuizzes = [...studentQuizzes].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const avgScore = sortedQuizzes.reduce((acc, curr) => acc + curr.score, 0) / sortedQuizzes.length;
        const recentScore = sortedQuizzes[sortedQuizzes.length - 1].score;
        const scoreDrop = avgScore - recentScore;
        
        // ML Heuristic Simulation
        if (student.focus < 60 && avgScore < 50) {
           insights.push({ type: 'danger', student: student.name, message: `High Risk: Consistently low focus (${student.focus}%) and failing average (${Math.round(avgScore)}%). Immediate intervention required.` });
        } else if (scoreDrop > 20) {
           insights.push({ type: 'danger', student: student.name, message: `Warning: Sudden performance drop detected. Recent quiz was ${Math.round(scoreDrop)}% below their average.` });
        } else if (student.focus < 70 && avgScore >= 50 && avgScore < 75) {
           insights.push({ type: 'warning', student: student.name, message: `Medium Risk: Focus is dropping (${student.focus}%) which may further impact their current average (${Math.round(avgScore)}%).` });
        } else if (avgScore > 90 && student.focus > 85) {
           insights.push({ type: 'success', student: student.name, message: `Excellent Trajectory: Consistent high engagement (${student.focus}%) correlating with top scores.` });
        } else if (studentQuizzes.length >= 3 && scoreDrop < -15) {
           insights.push({ type: 'success', student: student.name, message: `Positive Trend: Recent scores are significantly improving above their average.` });
        }
      }
    });
    return insights.length > 0 ? insights : [{ type: 'info', message: 'Gathering more data to generate predictive insights.' }];
  };
  const aiInsights = generatePredictiveInsights();

  const startLiveClass = (code) => {
    setActiveCode(code);
    setView('live-class');
    toast.success(`Live session started for ${code}`);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        code: randomCode,
        teacherId: user.uid,
        teacherName: user.name || 'Teacher',
        createdAt: new Date().toISOString()
      });
      setIsCreateModalOpen(false);
      setNewClassName('');
      toast.success(`Class ${newClassName} created successfully! Code: ${randomCode}`);
    } catch (err) {
      console.error("Error creating class:", err);
      toast.error("Failed to create class.");
    }
  };

  const handleAssignSession = async (e) => {
    e.preventDefault();
    if (!sessionData.subject || !sessionData.topic || !sessionData.quizQuestion) {
       toast.error("Please fill in the required fields.");
       return;
    }
    try {
      await addDoc(collection(db, 'study_sessions'), {
        teacherId: user.uid,
        teacherName: user.name || 'Teacher',
        subject: sessionData.subject,
        topic: sessionData.topic,
        duration: parseInt(sessionData.duration),
        parts: [
          {
            section: "1",
            content: sessionData.content || "<p>Study the following materials provided by the teacher.</p>",
            quiz: null
          }
        ],
        finalQuiz: {
           title: "Session Quiz",
           questions: [
             {
               question: sessionData.quizQuestion,
               options: {
                 A: sessionData.optA,
                 B: sessionData.optB,
                 C: sessionData.optC,
                 D: sessionData.optD
               },
               correctOption: sessionData.correctOpt
             }
           ]
        },
        createdAt: new Date().toISOString()
      });
      setIsAssignSessionModalOpen(false);
      setSessionData({ subject: '', topic: '', duration: 45, content: '', quizQuestion: '', optA: '', optB: '', optC: '', optD: '', correctOpt: 'A' });
      toast.success("Study Session assigned successfully!");
    } catch (err) {
      console.error("Error assigning session:", err);
      toast.error("Failed to assign session.");
    }
  };

  const handleBulkUpload = async () => {
    const toastId = toast.loading("Uploading bulk lessons...");
    try {
      let count = 0;
      for (const session of lessonsData) {
        // Remove 'id' if it exists to avoid conflicts, let Firestore generate it
        // eslint-disable-next-line no-unused-vars
        const { id, ...sessionWithoutId } = session;
        await addDoc(collection(db, 'study_sessions'), {
          ...sessionWithoutId,
          teacherId: user.uid,
          teacherName: user.name || 'Admin',
          createdAt: new Date().toISOString()
        });
        count++;
      }
      toast.dismiss(toastId);
      toast.success(`Successfully uploaded ${count} lessons!`);
    } catch (err) {
      console.error("Bulk upload error:", err);
      toast.dismiss(toastId);
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const handleClearSessions = async () => {
    const toastId = toast.loading("Clearing old sessions...");
    try {
      const snapshot = await getDocs(query(collection(db, 'study_sessions'), where('teacherId', '==', user?.uid)));
      let count = 0;
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'study_sessions', d.id));
        count++;
      }
      toast.dismiss(toastId);
      toast.success(`Successfully cleared ${count} sessions!`);
    } catch (err) {
      console.error("Clear error:", err);
      toast.dismiss(toastId);
      toast.error(`Clear failed: ${err.message}`);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if(window.confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteDoc(doc(db, 'study_sessions', sessionId));
        toast.success("Session deleted successfully.");
      } catch (err) {
        console.error("Error deleting session:", err);
        toast.error("Failed to delete session.");
      }
    }
  };

  const handlePrintReport = async () => {
    toast.loading("Generating professional PDF...", { id: 'pdf-toast' });
    try {
      const btn = document.querySelector('.pdf-btn-hide');
      if (btn) btn.style.display = 'none';

      const reportElement = document.querySelector('.printable-report');
      if (!reportElement) throw new Error("Report element not found");
      
      const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: '#060612' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedStudent?.name || 'Student'}_Focus_Report.pdf`);
      
      if (btn) btn.style.display = 'inline-block';
      toast.success("PDF Downloaded!", { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: 'pdf-toast' });
      const btn = document.querySelector('.pdf-btn-hide');
      if (btn) btn.style.display = 'inline-block';
    }
  };

  const handleGenerateQuizWithAI = async () => {
    if (!sessionData.content) {
      toast.error("Please enter lesson content first!");
      return;
    }
    
    setIsGeneratingQuiz(true);
    const toastId = toast.loading("AI is analyzing content and generating a quiz...");
    
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: sessionData.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz from server');
      }

      const quizResult = await response.json();
      
      setSessionData(prev => ({
        ...prev,
        quizQuestion: quizResult.question || '',
        optA: quizResult.options?.A || '',
        optB: quizResult.options?.B || '',
        optC: quizResult.options?.C || '',
        optD: quizResult.options?.D || '',
        correctOpt: quizResult.correctOpt || 'A'
      }));
      
      toast.success("Quiz generated successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("AI Generation failed. Check console.", { id: toastId });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const getBorderColor = (status) => {
    if (status === 'distracted') return 'var(--danger)';
    if (status === 'warning') return 'var(--warning)';
    return 'var(--success)';
  };

  if (view === 'live-class') {
    const avgFocus = students.length > 0 ? Math.round(students.reduce((acc, curr) => acc + curr.focus, 0) / students.length) : 100;
    
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderLeft: '4px solid var(--danger)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.5s infinite' }}></div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>LIVE SESSION</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Class Code: <strong style={{ color: 'white', letterSpacing: '2px' }}>{activeCode}</strong></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'center', paddingRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Class Focus</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: avgFocus > 75 ? 'var(--success)' : 'var(--warning)' }}>{avgFocus}%</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setView('overview')} style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>{t('teacher.live_end')}</button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Left Area - Student Grid */}
          <div>
            <h3 style={{ marginBottom: '15px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i> {t('teacher.live_grid')} ({students.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              {students.map(student => (
                <div key={student.id} className="glass-panel" style={{ padding: '15px', textAlign: 'center', borderRadius: '12px', transition: 'all 0.3s ease', borderTop: `3px solid ${getBorderColor(student.status)}` }}>
                  <div style={{ width: '60px', height: '60px', margin: '0 auto 10px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: `2px solid ${getBorderColor(student.status)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-user" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.5)' }}></i>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{student.name}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: getBorderColor(student.status) }}>{student.focus}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area - Alerts and Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Alerts Panel */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '250px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-bell" style={{ color: 'var(--warning)' }}></i> {t('teacher.live_alerts')}
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.map(alert => (
                  <div key={alert.id} style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid var(--warning)', borderRadius: '0 8px 8px 0', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '3px' }}>{alert.time}</div>
                    <div>{alert.msg}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Chat */}
            <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}><i className="fa-solid fa-bullhorn"></i> {t('teacher.live_broadcast')}</h3>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                {classroomMessages.map(msg => (
                  <div key={msg.id} style={{ background: msg.sender === 'Teacher' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', alignSelf: msg.sender === 'Teacher' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                    <span style={{ color: msg.sender === 'Teacher' ? 'var(--primary)' : 'var(--text-muted)', display: 'block', fontSize: '0.8rem', textAlign: msg.sender === 'Teacher' ? 'right' : 'left', fontWeight: 'bold' }}>
                      {msg.sender === 'Teacher' ? 'You' : msg.senderName}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendBroadcast} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  placeholder={t('teacher.live_type')} 
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 15px' }}>{t('teacher.live_send')}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fa-solid fa-chart-line" style={{ color: 'var(--primary)', marginRight: '15px' }}></i>{t('teacher.rep_title')}</h2>
          <div>
            <button className="btn btn-secondary" onClick={() => { setView('overview'); setSelectedStudent(null); }}>
              <i className="fa-solid fa-arrow-left"></i> {t('teacher.rep_back')}
            </button>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ marginLeft: '15px' }}>
              <i className="fa-solid fa-print"></i> Download PDF
            </button>
          </div>
        </div>

        <div className="reports-grid">
          {/* Student List */}
          <div className="glass-panel" style={{ padding: '20px', maxHeight: '700px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{t('teacher.rep_select')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {students.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  style={{ 
                    padding: '15px', 
                    borderRadius: '8px', 
                    background: selectedStudent?.id === s.id ? 'rgba(124, 58, 237, 0.2)' : 'rgba(0,0,0,0.2)', 
                    border: `1px solid ${selectedStudent?.id === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                  }}>
                  <span>{s.name}</span>
                  <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
                </button>
              ))}
            </div>
          </div>

          {/* Student Detailed Report */}
          <div className="glass-panel printable-report" style={{ padding: '30px', minHeight: '500px' }}>
            {selectedStudent ? (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-user-graduate" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>{selectedStudent.name}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>ID: STD-{selectedStudent.id.substring(0, 6).toUpperCase()}</p>
                  </div>
                </div>
                
                {(() => {
                   const studentQuizzes = quizResults.filter(q => q.studentName === selectedStudent.name);
                   const quizAverage = studentQuizzes.length > 0 
                     ? Math.round(studentQuizzes.reduce((acc, curr) => acc + curr.score, 0) / studentQuizzes.length)
                     : 0;
                   const sessionsAttended = selectedStudent.completedLessons?.length || 0;
                   const totalSessions = sessions.length || 0;
                   
                   const chartData = studentQuizzes.length > 0 ? studentQuizzes.slice(0, 10).reverse().map((q, idx) => ({
                      time: `Q${idx+1}`,
                      score: q.score,
                      title: q.quizTitle
                   })) : [
                      { time: 'No Data', score: 0 }
                   ];

                   return (
                     <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>AVERAGE FOCUS</div>
                             <div style={{ fontSize: '2rem', fontWeight: 'bold', color: selectedStudent.focus > 75 ? 'var(--success)' : 'var(--warning)' }}>{selectedStudent.focus}%</div>
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>QUIZ AVERAGE</div>
                             <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{studentQuizzes.length > 0 ? `${quizAverage}%` : 'N/A'}</div>
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>SESSIONS COMPLETED</div>
                             <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{sessionsAttended}/{totalSessions}</div>
                           </div>
                        </div>

                        <h3 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Quiz Performance Trend</h3>
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '30px', height: '300px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="time" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                              <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ background: 'rgba(6, 6, 18, 0.9)', border: '1px solid var(--primary)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--primary)' }}
                                formatter={(value, name, props) => [value + '%', props.payload.title || 'Score']}
                              />
                              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--secondary)' }} activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                     </>
                   )
                })()}

                <h3 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Recent Quiz Results</h3>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {quizResults.filter(q => q.studentName === selectedStudent.name).length > 0 ? (
                    quizResults.filter(q => q.studentName === selectedStudent.name).map(quiz => (
                      <div key={quiz.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <i className="fa-solid fa-check-circle" style={{ color: quiz.score >= 50 ? 'var(--success)' : 'var(--danger)', marginTop: '3px' }}></i>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{quiz.sessionTopic} - {quiz.quizTitle}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {new Date(quiz.timestamp).toLocaleString()} • Score: {quiz.score}% ({quiz.correct}/{quiz.total} Correct)
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No quiz results found for this student yet.</div>
                  )}
                </div>

                <div className="no-print pdf-btn-hide" style={{ marginTop: '30px', textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={handlePrintReport}><i className="fa-solid fa-download"></i> Download PDF Report</button>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-user-astronaut" style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}></i>
                <h2>Select a student</h2>
                <p>Click on a student from the list to view their detailed performance report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compute Real Data Statistics
  const realActiveStudents = students.length;
  const realClassesTaught = createdClasses.length;
  const realAvgEngagement = quizResults.length > 0 
    ? Math.round(quizResults.reduce((acc, curr) => acc + (curr.averageFocus || 100), 0) / quizResults.length) 
    : 100;

  // OVERVIEW VIEW
  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>{t('teacher.title_1')} <span className="gradient-text">{t('teacher.title_2')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('teacher.welcome', { name: user?.name || 'Teacher' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={handleClearSessions} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--danger)', border: 'none', color: 'white' }}>
            <i className="fa-solid fa-trash"></i> {t('teacher.btn_clear')}
          </button>
          <button className="btn btn-secondary" onClick={handleBulkUpload} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--success)', border: 'none', color: 'white' }}>
            <i className="fa-solid fa-cloud-arrow-up"></i> {t('teacher.btn_import')}
          </button>
          <button className="btn btn-secondary" onClick={() => setView('reports')} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-chart-line"></i> {t('teacher.btn_reports')}
          </button>
          <button className="btn btn-secondary" onClick={() => setIsAssignSessionModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <i className="fa-solid fa-book-open"></i> {t('teacher.btn_assign')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-plus"></i> {t('teacher.btn_create')}
          </button>
        </div>
      </div>

      {/* AI PREDICTIVE INSIGHTS SECTION */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05 }}><i className="fa-solid fa-brain"></i></div>
         <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-sparkles"></i> AI Predictive Analytics
         </h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {aiInsights.map((insight, idx) => (
               <div key={idx} style={{ 
                  padding: '15px', 
                  borderRadius: '8px', 
                  background: insight.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : (insight.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : (insight.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)')),
                  border: `1px solid ${insight.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : (insight.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : (insight.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.1)'))}`
               }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: insight.type === 'danger' ? '#fca5a5' : (insight.type === 'warning' ? '#fcd34d' : (insight.type === 'success' ? '#86efac' : 'white')) }}>
                     {insight.type === 'danger' && <i className="fa-solid fa-triangle-exclamation"></i>}
                     {insight.type === 'warning' && <i className="fa-solid fa-bell"></i>}
                     {insight.type === 'success' && <i className="fa-solid fa-star"></i>}
                     {insight.type === 'info' && <i className="fa-solid fa-info-circle"></i>}
                     {' '} {insight.student ? insight.student : 'System Status'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{insight.message}</div>
               </div>
            ))}
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{t('teacher.stat_students')}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{realActiveStudents}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{t('teacher.stat_classes')}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{realClassesTaught}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{t('teacher.stat_engagement')}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{realAvgEngagement}%</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{t('teacher.chart_title')}</h2>
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} />
              <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ background: 'rgba(6, 6, 18, 0.9)', border: '1px solid var(--primary)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--primary)' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="engagement" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="fa-solid fa-chalkboard" style={{ color: 'var(--primary)' }}></i> {t('teacher.classes_title')}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Dynamically Created Classes */}
        {createdClasses.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>No classes created yet.</div>
        )}
        {createdClasses.map((cls, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '25px', borderRadius: '16px', borderTop: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <div style={{ background: 'rgba(167, 139, 250, 0.2)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', marginBottom: '10px', fontWeight: 'bold' }}>NEW CLASS</div>
                <h3 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>{cls.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>0 {t('teacher.enrolled')}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CODE</div>
                <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{cls.code}</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => startLiveClass(cls.code)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, var(--accent), var(--primary))' }}>
              <i className="fa-solid fa-video"></i> {t('teacher.start_live')}
            </button>
          </div>
        ))}

      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px' }}>
        <i className="fa-solid fa-book-open" style={{ color: 'var(--secondary)' }}></i> Manage Study Sessions
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {sessions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No study sessions assigned yet.</div>
        ) : (
          sessions.map((sess) => (
            <div key={sess.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid var(--secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{sess.topic}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>{sess.subject} • {sess.duration} mins</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => handleDeleteSession(sess.id)} style={{ padding: '8px 12px', fontSize: '0.9rem', color: 'var(--danger)', borderColor: 'var(--danger)', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE CLASS MODAL */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 6, 18, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel" style={{ width: '400px', padding: '30px', borderRadius: '16px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Create New Class</h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-times"></i></button>
            </div>
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Class Name / Subject</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Grade 12 Chemistry"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Generate Class Code</button>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SESSION MODAL */}
      {isAssignSessionModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 6, 18, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '16px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Assign Study Session</h2>
              <button onClick={() => setIsAssignSessionModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-times"></i></button>
            </div>
            <form onSubmit={handleAssignSession} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Subject</label>
                  <input type="text" required value={sessionData.subject} onChange={(e) => setSessionData({...sessionData, subject: e.target.value})} placeholder="e.g. Biology" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Duration (mins)</label>
                  <input type="number" required value={sessionData.duration} onChange={(e) => setSessionData({...sessionData, duration: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Topic</label>
                <input type="text" required value={sessionData.topic} onChange={(e) => setSessionData({...sessionData, topic: e.target.value})} placeholder="e.g. Cellular Respiration" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', marginBottom: '10px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lesson Content (HTML allowed)</label>
                <textarea required value={sessionData.content} onChange={(e) => setSessionData({...sessionData, content: e.target.value})} placeholder="<p>Write your lesson content here...</p>" rows="4" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'vertical' }}></textarea>
              </div>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--secondary)' }}>Post-Session Quiz</h3>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleGenerateQuizWithAI} 
                    disabled={isGeneratingQuiz}
                    style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'rgba(124, 58, 237, 0.2)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  >
                    {isGeneratingQuiz ? <><i className="fa-solid fa-spinner fa-spin"></i> Generating...</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate with AI</>}
                  </button>
                </div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quiz Question</label>
                <input type="text" required value={sessionData.quizQuestion} onChange={(e) => setSessionData({...sessionData, quizQuestion: e.target.value})} placeholder="e.g. Where does Cellular Respiration primarily occur?" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', marginBottom: '10px' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', width: '20px' }}>A)</span>
                    <input type="text" required value={sessionData.optA} onChange={(e) => setSessionData({...sessionData, optA: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', width: '20px' }}>B)</span>
                    <input type="text" required value={sessionData.optB} onChange={(e) => setSessionData({...sessionData, optB: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', width: '20px' }}>C)</span>
                    <input type="text" required value={sessionData.optC} onChange={(e) => setSessionData({...sessionData, optC: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', width: '20px' }}>D)</span>
                    <input type="text" required value={sessionData.optD} onChange={(e) => setSessionData({...sessionData, optD: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Correct Option</label>
                  <select value={sessionData.correctOpt} onChange={(e) => setSessionData({...sessionData, correctOpt: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAssignSessionModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Assign Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;
