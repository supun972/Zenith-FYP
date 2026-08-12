import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import Confetti from 'react-confetti';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, addDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Tesseract from 'tesseract.js';
import FocusTracker from '../components/student/FocusTracker';
import AIChatTutor from '../components/student/AIChatTutor';

const StudentPortal = () => {
  const { user } = useAuth();
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'session' | 'quiz'
  const [quizState, setQuizState] = useState(null); // null | 'results' | 'completed'
  const [quizAnswers, setQuizAnswers] = useState({}); // { 0: 'A', 1: 'B' }
  const [timeLeft, setTimeLeft] = useState(2700);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(300); // 5 minutes
  const [focusScore, setFocusScore] = useState(100);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResults, setQuizResults] = useState(null); // { correct: 0, wrong: 0, total: 0, score: 0 }
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const isOnBreakRef = useRef(isOnBreak);
  useEffect(() => { isOnBreakRef.current = isOnBreak; }, [isOnBreak]);
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [completedSessionIds, setCompletedSessionIds] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  
  // Time Selector Modal State
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedSessionToStart, setSelectedSessionToStart] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'classes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = [];
      snapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      setAvailableClasses(classesData);
    });

    const qSessions = query(collection(db, 'study_sessions'));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const sessionsData = [];
      snapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() });
      });
      sessionsData.sort((a, b) => {
        const strA = a.topic ? String(a.topic) : '';
        const strB = b.topic ? String(b.topic) : '';
        const numA = parseInt(strA.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(strB.replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
      });

      setAssignedSessions(sessionsData);
    }, (error) => {
      console.error("Zenith Debug - Firebase Error:", error);
    });

    let unsubUser = () => {};
    if (user && user.uid) {
      unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().completedLessons) {
          const lessons = docSnap.data().completedLessons;
          setCompletedSessionIds(Array.isArray(lessons) ? lessons : [lessons]);
        } else {
          setCompletedSessionIds([]);
        }
      });
    }

    return () => {
      unsubscribe();
      unsubSessions();
      unsubUser();
    };
  }, [user]);
  
  // Chat States
  const [chatTab, setChatTab] = useState('ai'); // 'classroom' | 'ai'
  const [aiMessages, setAiMessages] = useState([{ sender: 'ai', text: 'Hi! I am your ZENITH AI Tutor. How can I help you today?' }]);
  const [classroomMessages, setClassroomMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    if (activeSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAiMessages([{ 
        sender: 'ai', 
        text: `Hi! I am your ZENITH AI Tutor. I see you are studying ${activeSession.subject} - ${activeSession.topic}. Do you have any questions before we begin?` 
      }]);
    } else {
      setAiMessages([{ sender: 'ai', text: 'Hi! I am your ZENITH AI Tutor. How can I help you today?' }]);
    }
  }, [activeSession]);

  // Fetch Classroom Messages
  useEffect(() => {
    const q = query(collection(db, 'classroom_messages'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setClassroomMessages(msgs);
    });
    return () => unsub();
  }, []);

  // Real-time Sync to LocalStorage and Firestore
  useEffect(() => {
    localStorage.setItem('live_student_focus', focusScore.toString());
    const syncFocus = async () => {
      if (user && user.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { focus: focusScore });
        } catch (e) {
          console.error("Firestore sync error:", e);
        }
      }
    };
    syncFocus();
  }, [focusScore, user]);

  // Alternative Anti-Cheat Mechanisms (Blur/Focus)
  useEffect(() => {
    const handleBlur = () => {
      if (viewRef.current === 'session') {
        // Window lost focus (tab switch or different app)
        setFocusScore(prev => Math.max(0, prev - 30));
        toast.error("WARNING: Window Focus Lost! Please stay on the lesson.", {
          duration: 4000,
          icon: '⚠️'
        });
        
        if (user && user.name) {
          try {
            addDoc(collection(db, 'classroom_messages'), {
              sender: 'System',
              senderName: 'Anti-Cheat Engine',
              text: `⚠️ ${user.name} looked away or opened another app!`,
              timestamp: new Date().toISOString()
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [user]);

  const webcamRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping, chatTab]);

  // Load FaceAPI Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
        console.log("Face-API Models & Emotion Models Loaded Successfully!");
      } catch (err) {
        console.error("Error loading models:", err);
        setModelError(true);
      }
    };
    loadModels();
  }, []);

  // Actual AI Face Tracking Logic
  useEffect(() => {
    let timer;
    let focusInterval;
    let isMounted = true;
    
    if (view === 'session' || view === 'quiz') {
      timer = setInterval(() => {
        if (isOnBreakRef.current) {
          setBreakTimeLeft(prev => {
            if (prev <= 1) {
              setIsOnBreak(false);
              return 300;
            }
            return prev - 1;
          });
        } else {
          setTimeLeft((prev) => {
            // Trigger break automatically when 30 mins (1800s) have passed (2700 - 1800 = 900)
            // Fix: Don't trigger if it's a 15-minute session
            if (prev === 900 && activeSession?.duration > 15) {
              setIsOnBreak(true);
              return prev;
            }
            return prev > 0 ? prev - 1 : 0;
          });
        }
      }, 1000);
      
      let isDetecting = false;
      let missedFrames = 0; // Track consecutive missed frames
      let frustrationCount = 0; // Track consecutive negative emotions
      
      focusInterval = setInterval(async () => {
        if (isCameraActive && modelsLoaded && webcamRef.current && webcamRef.current.video) {
          if (webcamRef.current.video.readyState === 4 && !isDetecting) { // Ensure video is ready and not already detecting
            isDetecting = true;
            try {
              // Detect face with higher inputSize for better reliability when head turns slightly
              const detection = await faceapi.detectSingleFace(
                webcamRef.current.video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 })
              ).withFaceExpressions();

              if (!isMounted) return;

              if (detection) {
                missedFrames = 0; // Reset missed frames when face is found
                
                // --- Emotion Tracking ---
                const expressions = detection.expressions;
                let highestEmotion = 'neutral';
                let maxVal = 0;
                for (const [emotion, val] of Object.entries(expressions)) {
                   if (val > maxVal) { maxVal = val; highestEmotion = emotion; }
                }
                setCurrentEmotion(highestEmotion);
                
                if (highestEmotion === 'sad' || highestEmotion === 'angry' || highestEmotion === 'fearful' || highestEmotion === 'disgusted') {
                   frustrationCount++;
                   if (frustrationCount > 4) { // If frustrated for 4+ seconds
                      frustrationCount = 0; // reset
                      setChatTab('ai'); // Switch to AI tab
                      const tutorMsg = "I noticed you're looking a bit confused or frustrated. Do you want me to explain this section differently?";
                      setAiMessages(prev => [...prev, { sender: 'ai', text: tutorMsg }]);
                      
                      // Speak it out!
                      if ('speechSynthesis' in window) {
                         const utterance = new SpeechSynthesisUtterance(tutorMsg);
                         window.speechSynthesis.speak(utterance);
                      }
                      
                      toast('AI Tutor activated due to confusion detected!', { icon: '🤖' });
                   }
                } else {
                   frustrationCount = Math.max(0, frustrationCount - 1); // Decrease if normal
                }

                // Face Found! They are looking at the screen.
                setFocusScore(prev => {
                  const fluctuation = Math.floor(Math.random() * 3); 
                  let newScore = prev + 8 + fluctuation; // Climb up faster if face detected
                  return newScore > 98 ? 98 : Math.floor(newScore);
                });
              } else {
                missedFrames++;
                setCurrentEmotion('away'); // User is away
                // Only drop score if face is missing for more than 3 consecutive seconds (forgiving for reading/blinking)
                if (missedFrames > 3) {
                  setFocusScore(prev => {
                    let newScore = prev - 4; // Drop slowly
                    return newScore < 0 ? 0 : newScore;
                  });
                }
              }
            } catch (err) {
              console.error("Face detection error:", err);
            } finally {
              isDetecting = false;
            }
          }
        } else if (!isCameraActive && view === 'session') {
           if (isMounted) setFocusScore(0);
        }
      }, 1000); // Check every second for better real-time feel
    }
    
    return () => {
      isMounted = false;
      clearInterval(timer);
      clearInterval(focusInterval);
    };
  }, [view, isCameraActive, modelsLoaded, activeSession?.duration]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (chatTab === 'ai') {
      const userText = inputValue;
      setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
      setInputValue('');
      setIsAiTyping(true);
      
      try {
        let text = "";
        
        try {
          const currentContext = activeSession 
            ? `The student is currently studying: ${activeSession.subject} - ${activeSession.topic}.`
            : 'The student is on the main dashboard and not currently in a specific lesson.';
            
          const conversationContext = aiMessages.slice(-6).map(msg => `${msg.sender === 'ai' ? 'Tutor' : 'Student'}: ${msg.text}`).join('\n');
          
          const response = await fetch('/api/tutor-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userText, conversationContext, currentContext }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate AI reply from server');
          }

          const result = await response.json();
          text = result.reply;
          text = text.replace(/\*/g, '');
        } catch (apiError) {
          console.error("AI API Error:", apiError);
          text = `Oops! There was an error connecting to the AI: ${apiError.message || apiError}. Please check your API key and internet connection.`;
        }

        setAiMessages(prev => [...prev, { sender: 'ai', text }]);
      } catch (error) {
        console.error("General Error:", error);
      } finally {
        setIsAiTyping(false);
      }
    } else if (chatTab === 'classroom') {
      try {
        await addDoc(collection(db, 'classroom_messages'), {
          sender: 'Student',
          senderName: user?.name || 'Student',
          text: inputValue,
          timestamp: new Date().toISOString()
        });
        setInputValue('');
      } catch (err) {
        console.error("Chat error:", err);
      }
    }
  };

  const handleEndSession = () => {
    setIsCameraActive(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
    }
    setView('dashboard');
  };

  const handleReadAloud = async () => {
    if ('speechSynthesis' in window) {
      if (isReadingAloud) {
        window.speechSynthesis.cancel();
        if (window.currentGoogleAudio) {
           window.currentGoogleAudio.pause();
           window.currentGoogleAudio = null;
        }
        setIsReadingAloud(false);
        setIsOcrProcessing(false);
      } else {
        const currentPart = activeSession?.parts?.[activePartIndex] || { content: '<p>No content available for this session.</p>' };
        const rawContent = currentPart.content;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = rawContent;
        
        let finalSpeakingText = tempDiv.textContent || tempDiv.innerText || "";
        
        // Find all images to OCR
        const images = tempDiv.querySelectorAll('img');
        if (images.length > 0) {
          setIsOcrProcessing(true);
          try {
             let ocrText = '';
             // We use a toast to let them know OCR started (might take 2-4 seconds)
             const toastId = toast.loading("AI is scanning the image text...");
             
             for (const img of images) {
                const src = img.getAttribute('src');
                if (src) {
                   const { data: { text } } = await Tesseract.recognize(
                     src,
                     'sin', // Sinhala Language Model!
                     { logger: m => console.log(m) }
                   );
                   ocrText += " " + text;
                }
             }
             toast.dismiss(toastId);
             finalSpeakingText += " " + ocrText;
          } catch (err) {
             console.error("OCR Error:", err);
             toast.dismiss();
             toast.error("Failed to read image text.");
          }
          setIsOcrProcessing(false);
        }

        console.log("FINAL TEXT TO SPEAK:", finalSpeakingText);

        // Check for Sinhala voice in browser
        const voices = window.speechSynthesis.getVoices();
        const sinhalaVoice = voices.find(v => v.lang.includes('si') || v.lang.includes('sin') || v.name.toLowerCase().includes('sinhala'));
        
        if (sinhalaVoice) {
           const utterance = new SpeechSynthesisUtterance(finalSpeakingText);
           utterance.lang = 'si-LK';
           utterance.voice = sinhalaVoice;
           utterance.rate = 0.9;
           utterance.onend = () => setIsReadingAloud(false);
           window.speechSynthesis.speak(utterance);
           setIsReadingAloud(true);
        } else {
           // FALLBACK: Google Cloud TTS via Audio URL
           console.log("No local Sinhala voice. Using Google Cloud Voice...");
           try {
              // Split text into chunks of max 150 chars to avoid Google TTS 400 Bad Request (200 char limit)
              const textChunks = [];
              let currentStr = finalSpeakingText;
              while (currentStr.length > 0) {
                 textChunks.push(currentStr.substring(0, 150));
                 currentStr = currentStr.substring(150);
              }
              
              let currentChunk = 0;
              const playNextChunk = async () => {
                 if (currentChunk >= textChunks.length) {
                    setIsReadingAloud(false);
                    return;
                 }
                 try {
                    const audioUrl = `/api/tts?ie=UTF-8&q=${encodeURIComponent(textChunks[currentChunk])}&tl=si&client=gtx`;
                    const response = await fetch(audioUrl, { referrerPolicy: "no-referrer" });
                    if (!response.ok) {
                       throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    const audio = new Audio(blobUrl);
                    audio.onended = () => {
                       URL.revokeObjectURL(blobUrl);
                       currentChunk++;
                       playNextChunk();
                    };
                    audio.onerror = (e) => {
                       console.error("Audio playback failed", e);
                       setIsReadingAloud(false);
                       toast.error("Cloud Voice Playback Error");
                    };
                    window.currentGoogleAudio = audio;
                    audio.play();
                 } catch (err) {
                    console.error("Google TTS Fetch failed:", err);
                    setIsReadingAloud(false);
                    toast.error("Cloud Voice Error: " + err.message);
                 }
              };
              
              playNextChunk();
              setIsReadingAloud(true);
           } catch (e) {
              console.error("Cloud TTS error:", e);
              setIsReadingAloud(false);
           }
        }
      }
    } else {
       toast.error("Text to speech not supported in this browser.");
    }
  };

  const handleUserMedia = () => {
    setIsCameraActive(true);
  };

  const handleUserMediaError = () => {
    setIsCameraActive(false);
    toast.error("Camera access denied! Focus tracking requires webcam access.");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartSessionClick = (session) => {
    setSelectedSessionToStart(session);
    setShowTimeModal(true);
  };

  const confirmStartSession = (minutes) => {
    try {
      const session = selectedSessionToStart;
      if (!session) {
        toast.error("Error: No session selected!");
        return;
      }
      
      setActiveSession({ ...session, duration: minutes });
      setActivePartIndex(0);
      setQuizAnswers({});
      setQuizResults(null);
      setCurrentQuestion(0);
      setTimeLeft(minutes * 60);
      setView('session');
      setShowTimeModal(false);
      setSelectedSessionToStart(null);
    } catch (err) {
      console.error("Crash in confirmStartSession:", err);
      toast.error("An error occurred: " + err.message);
    }
  };

  const handleAnswerSelect = (qIdx, opt) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  if (view === 'session' || view === 'quiz') {
    const isFinalQuiz = activePartIndex >= (activeSession?.parts?.length || 0);
    const currentQuiz = isFinalQuiz ? activeSession?.finalQuiz : activeSession?.parts?.[activePartIndex]?.quiz;
    const q = currentQuiz?.questions?.[currentQuestion];

    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{activeSession?.subject}: {activeSession?.topic}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Assigned by {activeSession?.teacherName || 'Teacher'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Remaining</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatTime(timeLeft)}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setIsOnBreak(true)} style={{ border: '1px solid var(--secondary)', background: 'transparent' }}><i className="fa-solid fa-mug-hot"></i> Simulate Break</button>
            <button className="btn btn-secondary" onClick={handleEndSession}>End Session</button>
          </div>
        </div>

        {/* MANDATORY BREAK OVERLAY */}
        {isOnBreak && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 6, 18, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }}>
             <i className="fa-solid fa-mug-hot" style={{ fontSize: '6rem', color: 'var(--secondary)', marginBottom: '30px', animation: 'pulse 2s infinite' }}></i>
             <h2 style={{ fontSize: '3rem', marginBottom: '15px' }}>Brain Break Time!</h2>
             <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', textAlign: 'center' }}>You've been focusing hard for 30 minutes. Taking a short break reduces mental fatigue and improves retention.</p>
             <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '40px' }}>{formatTime(breakTimeLeft)}</div>
             <button className="btn btn-secondary" onClick={() => { setIsOnBreak(false); setBreakTimeLeft(300); setTimeLeft(prev => prev - 1); }}>Resume Session Early</button>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Main Content Area */}
          <div className="glass-panel" style={{ height: '800px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button className="btn btn-primary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}><i className="fa-solid fa-file-pdf"></i> Lesson Notes</button>
              <button className="btn btn-secondary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}><i className="fa-solid fa-video"></i> Video Lecture</button>
            </div>
              <div 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '30px', overflowY: 'auto', maxHeight: '65vh', color: 'var(--text)', lineHeight: '1.8', position: 'relative' }}
                onScroll={(e) => {
                  const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
                  if (bottom) {
                     const isFinalPart = activePartIndex >= (activeSession?.parts?.length || 0);
                     if (!isFinalPart && activeSession?.parts?.[activePartIndex]?.quiz) {
                        if (view !== 'quiz') {
                          // Play a simple notification sound
                          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                          audio.volume = 0.5;
                          audio.play().catch(e => console.log('Audio play failed', e));
                          toast("Quiz time! Let's test your knowledge.", { icon: '📝', duration: 5000 });
                        }
                        setView('quiz');
                     }
                  }
                }}
              >
                {view === 'quiz' ? (
                  // --- QUIZ UI ---
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {(!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) ? (
                     <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p>No quiz available.</p>
                        <button className="btn btn-primary" onClick={() => { 
                           if (!isFinalQuiz) { setActivePartIndex(prev => prev + 1); setView('session'); }
                           else { setView('dashboard'); }
                        }}>Continue</button>
                     </div>
                  ) : quizState !== 'completed' ? (
                    <>
                      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', color: 'var(--primary)' }}>{currentQuiz.title || 'Knowledge Check'}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '15px' }}>Question {currentQuestion + 1} of {currentQuiz.questions.length}</p>
                      <h3 style={{ margin: '15px 0 25px 0', fontSize: '1.2rem', lineHeight: '1.5' }}>{q?.question}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {q && Object.entries(q.options).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, text]) => (
                          <button 
                            key={key}
                            className="btn btn-secondary" 
                            style={{ 
                              textAlign: 'left', 
                              border: quizAnswers[currentQuestion] === key ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                              background: quizAnswers[currentQuestion] === key ? 'rgba(124, 58, 237, 0.15)' : 'rgba(0,0,0,0.2)',
                              display: 'flex', alignItems: 'center', gap: '15px',
                              padding: '15px 20px',
                              fontSize: '1.05rem',
                              transition: 'all 0.2s ease',
                              transform: quizAnswers[currentQuestion] === key ? 'scale(1.02)' : 'scale(1)'
                            }} 
                            onClick={() => handleAnswerSelect(currentQuestion, key)}
                          >
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: quizAnswers[currentQuestion] === key ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>
                              {key}
                            </div>
                            {text}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                        <button 
                          className="btn btn-secondary" 
                          disabled={currentQuestion === 0}
                          onClick={() => setCurrentQuestion(prev => prev - 1)}
                          style={{ padding: '10px 20px' }}
                        >
                          <i className="fa-solid fa-arrow-left"></i> Previous
                        </button>
                        {currentQuestion < currentQuiz.questions.length - 1 ? (
                          <button 
                            className="btn btn-primary"
                            disabled={!quizAnswers[currentQuestion]}
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                            style={{ padding: '10px 30px' }}
                          >
                            Next <i className="fa-solid fa-arrow-right"></i>
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            disabled={!quizAnswers[currentQuestion]}
                            style={{ padding: '10px 30px' }}
                            onClick={async () => {
                              let correct = 0;
                              let wrong = 0;
                              currentQuiz.questions.forEach((question, i) => {
                                if (quizAnswers[i] === question.correctOption) correct++;
                                else wrong++;
                              });
                              const score = Math.round((correct / currentQuiz.questions.length) * 100);
                              setQuizResults({ correct, wrong, total: currentQuiz.questions.length, score });
                              
                              try {
                                await addDoc(collection(db, 'quiz_results'), {
                                    studentId: user.uid,
                                    studentName: user.name || user.email,
                                    sessionTopic: activeSession.topic,
                                    quizTitle: isFinalQuiz ? "Final Quiz" : "Section " + (activePartIndex + 1) + " Quiz",
                                    score: score,
                                    correct: correct,
                                    wrong: wrong,
                                    total: currentQuiz.questions.length,
                                    averageFocus: focusScore,
                                    timestamp: new Date().toISOString()
                                });
                                if (isFinalQuiz) {
                                  try {
                                    await updateDoc(doc(db, 'users', user.uid), {
                                      completedLessons: arrayUnion(activeSession.id)
                                    });
                                  } catch(e) { console.error("Error updating completed lessons", e); }
                                  setShowConfetti(true);
                                  toast.success("Lesson Completed Successfully!");
                                }
                              } catch (err) {
                                console.error("Failed to save quiz results", err);
                                toast.error("Could not save results to database, but you finished!");
                              }
                              setQuizState('completed');
                            }}
                          >
                            Submit Quiz <i className="fa-solid fa-check"></i>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
                      <div style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '15px' }}><i className="fa-solid fa-check-circle"></i></div>
                      <h2 style={{ marginBottom: '15px', fontSize: '2rem' }}>Excellent Work!</h2>
                      
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '16px', margin: '20px 0', textAlign: 'center', minWidth: '300px' }}>
                         <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '15px' }}>{quizResults?.score}%</div>
                         <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <div>
                               <div style={{ fontSize: '1.5rem', color: 'var(--success)', fontWeight: 'bold' }}>{quizResults?.correct}</div>
                               <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Correct</div>
                            </div>
                            <div>
                               <div style={{ fontSize: '1.5rem', color: 'var(--danger)', fontWeight: 'bold' }}>{quizResults?.wrong}</div>
                               <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Wrong</div>
                            </div>
                         </div>
                      </div>
    
                      {!isFinalQuiz ? (
                         <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.1rem' }} onClick={() => { 
                            setActivePartIndex(prev => prev + 1); 
                            setView('session'); 
                            setQuizState(null);
                            setQuizAnswers({});
                            setCurrentQuestion(0);
                         }}>Continue to Next Section <i className="fa-solid fa-arrow-right"></i></button>
                      ) : (
                         <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.1rem' }} onClick={() => { 
                            setView('dashboard'); 
                            setActiveSession(null); 
                            setShowConfetti(false);
                         }}>Return to Dashboard</button>
                      )}
                     </div>
                  )}
                  </div>
                ) : (
                  // --- LESSON UI ---
                  <>
                  {/* Lesson Header */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                     <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                       Section {activePartIndex < (activeSession?.parts?.length || 0) ? activeSession?.parts?.[activePartIndex]?.section : 'Final'}
                     </h3>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scroll to the bottom of this section to unlock the quiz.</div>
                   </div>
                   {activePartIndex < (activeSession?.parts?.length || 0) && (
                     <button className="btn btn-secondary" onClick={handleReadAloud} disabled={isOcrProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', fontSize: '0.9rem' }}>
                       {isOcrProcessing ? <><i className="fa-solid fa-spinner fa-spin"></i> AI Scanning...</> : isReadingAloud ? <><i className="fa-solid fa-volume-xmark"></i> Stop Audio</> : <><i className="fa-solid fa-volume-high"></i> Read Aloud</>}
                     </button>
                   )}
                </div>

                {activePartIndex < (activeSession?.parts?.length || 0) ? (
                  <div style={{ position: 'relative' }}>
                    {/* Distraction Blur Overlay */}
                    {isCameraActive && focusScore < 50 && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(6, 6, 18, 0.7)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', backdropFilter: 'blur(3px)' }}>
                        <i className="fa-solid fa-eye" style={{ fontSize: '4rem', color: 'var(--danger)', marginBottom: '15px', animation: 'pulse 1s infinite' }}></i>
                        <h2 style={{ color: 'var(--danger)', margin: 0 }}>Reading Paused</h2>
                        <p style={{ color: 'white', marginTop: '10px' }}>Please look back at the screen to continue reading.</p>
                      </div>
                    )}
                    
                    <div style={{ filter: isCameraActive && focusScore < 50 ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease', opacity: isCameraActive && focusScore < 50 ? 0.5 : 1 }}>
                      <div dangerouslySetInnerHTML={{ __html: activeSession?.parts?.[activePartIndex]?.content || '<p>No content available.</p>' }} className="lesson-content" />
                      <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', clear: 'both' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>You have reached the end of this section.</p>
                        {activeSession?.parts?.[activePartIndex]?.quiz ? (
                          <button className="btn btn-primary" onClick={() => setView('quiz')} disabled={view === 'quiz'}><i className="fa-solid fa-play"></i> {view === 'quiz' ? 'Quiz in Progress ->' : 'Take Section Quiz'}</button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => setActivePartIndex(prev => prev + 1)}>Continue to Next Section <i className="fa-solid fa-arrow-right"></i></button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <i className="fa-solid fa-flag-checkered" style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '20px' }}></i>
                    <h2>Lesson Content Completed!</h2>
                    {activeSession?.finalQuiz ? (
                       <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => {
                          toast("Final Quiz time! Let's test your knowledge.", { icon: '📝', duration: 5000 });
                          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                          audio.volume = 0.5;
                          audio.play().catch(e => console.log(e));
                          setView('quiz');
                       }}><i className="fa-solid fa-star"></i> Take Final Lesson Quiz</button>
                    ) : (
                       <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={async () => { 
                         // No final quiz, just mark as completed
                         try {
                           await updateDoc(doc(db, 'users', user.uid), {
                             completedLessons: arrayUnion(activeSession.id)
                           });
                           toast.success("Lesson Completed!");
                         } catch (e) {
                           console.error(e);
                         }
                         setView('dashboard'); 
                       }}>Finish Session</button>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </div>

          {/* Right Sidebar - AI Tools & Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '800px' }}>
            <FocusTracker 
              modelsLoaded={modelsLoaded} 
              modelError={modelError} 
              focusScore={focusScore} 
              currentEmotion={currentEmotion} 
              isCameraActive={isCameraActive} 
              handleUserMedia={handleUserMedia} 
              handleUserMediaError={handleUserMediaError} 
              webcamRef={webcamRef} 
            />

            <AIChatTutor 
              chatTab={chatTab} 
              setChatTab={setChatTab} 
              aiMessages={aiMessages} 
              classroomMessages={classroomMessages} 
              isAiTyping={isAiTyping} 
              inputValue={inputValue} 
              setInputValue={setInputValue} 
              handleSendMessage={handleSendMessage} 
              messagesEndRef={messagesEndRef} 
            />
          </div>
        </div>

        <style>{`
          @keyframes scan {
            0% { top: -20px; }
            50% { top: 100%; }
            100% { top: -20px; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{user?.email || 'Student Account'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="glass-panel" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '50px' }}>
            {focusScore > 80 ? (
              <span style={{ color: 'var(--success)' }}><i className="fa-solid fa-trophy"></i> Top Performer</span>
            ) : (
              <span style={{ color: 'var(--primary)' }}><i className="fa-solid fa-book"></i> Active Learner</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Average Focus Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{focusScore}%</div>
          <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '5px' }}>{focusScore > 80 ? <><i className="fa-solid fa-arrow-up"></i> Great focus!</> : 'Keep it up!'}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Total Study Hours</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{((completedSessionIds?.length || 0) * 45 / 60).toFixed(1)}h</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '5px' }}>Based on completed sessions</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Tasks Completed</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{(completedSessionIds?.length || 0)}/{assignedSessions.length}</div>
          <div style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '5px' }}>{Math.max(0, assignedSessions.length - (completedSessionIds?.length || 0))} pending tasks</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gap: '30px' }}>
        {/* Left Col - Tasks */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i> Assigned Study Sessions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            {assignedSessions.filter(s => !(completedSessionIds || []).includes(s.id)).length > 0 ? 
              assignedSessions.filter(s => !(completedSessionIds || []).includes(s.id)).map((session) => (
              <div key={session.id} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>{session.subject}</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{session.topic}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><i className="fa-regular fa-clock"></i> Est. {session.duration} Minutes • Assigned by {session.teacherName}</div>
                </div>
                <button className="btn btn-primary" onClick={() => handleStartSessionClick(session)} style={{ padding: '10px 20px' }}>Start Session <i className="fa-solid fa-play" style={{ marginLeft: '5px' }}></i></button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No pending study sessions! Great job.</div>
            )}
          </div>

          {(completedSessionIds || []).length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-check-circle" style={{ color: 'var(--success)' }}></i> Completed Sessions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {assignedSessions.filter(s => (completedSessionIds || []).includes(s.id)).map(session => (
                  <div key={session.id} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>{session.subject}</div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{session.topic}</h3>
                      <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}><i className="fa-solid fa-check-circle"></i> Completed Successfully</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ color: 'var(--success)', fontSize: '1.5rem' }}><i className="fa-solid fa-medal"></i></div>
                      <button className="btn btn-secondary" onClick={() => handleStartSessionClick(session)} style={{ padding: '8px 15px', fontSize: '0.9rem' }}>
                        <i className="fa-solid fa-rotate-right"></i> Redo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Col - Upcoming Classes from Firebase */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-calendar-day" style={{ color: 'var(--secondary)' }}></i> Upcoming Classes
          </h2>
          
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            {availableClasses.length > 0 ? (
              availableClasses.map((cls) => (
                <div key={cls.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ background: 'rgba(124, 58, 237, 0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center', minWidth: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>CODE</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{cls.code}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{cls.name}</h4>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cls.teacherName || 'Teacher'} • Live Class</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                <i className="fa-solid fa-bed" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                <p>No upcoming classes scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Selection Modal */}
      {showTimeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ marginBottom: '10px' }}><i className="fa-solid fa-stopwatch" style={{ color: 'var(--primary)' }}></i> Study Goal</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>How long do you plan to study this lesson today?</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
               <button className="btn btn-secondary" onClick={() => confirmStartSession(15)}>15 Minutes</button>
               <button className="btn btn-secondary" onClick={() => confirmStartSession(30)}>30 Minutes</button>
               <button className="btn btn-secondary" onClick={() => confirmStartSession(45)}>45 Minutes</button>
               <button className="btn btn-secondary" onClick={() => confirmStartSession(60)}>60 Minutes</button>
            </div>
            
            <button className="btn btn-primary" onClick={() => setShowTimeModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
