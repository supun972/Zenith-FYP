import { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch user role from Firestore with a 2-second timeout
          const docRef = doc(db, 'users', currentUser.uid);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 10000)
          );
          
          const docSnap = await Promise.race([
            getDoc(docRef),
            timeoutPromise
          ]);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ uid: currentUser.uid, email: currentUser.email, ...data });
            localStorage.setItem(`zenith_user_${currentUser.uid}`, JSON.stringify(data));
          } else {
            // Fallback to localStorage if DB was wiped or inaccessible
            const cached = localStorage.getItem(`zenith_user_${currentUser.uid}`);
            if (cached) {
               setUser({ uid: currentUser.uid, email: currentUser.email, ...JSON.parse(cached) });
            } else {
               setUser({ uid: currentUser.uid, email: currentUser.email, role: 'student', name: currentUser.email.split('@')[0] });
            }
          }
        } catch (err) {
          console.warn("Network slow or offline, defaulting to cached or student role.", err.message);
          const cached = localStorage.getItem(`zenith_user_${currentUser.uid}`);
          if (cached) {
             setUser({ uid: currentUser.uid, email: currentUser.email, ...JSON.parse(cached) });
          } else {
             setUser({ uid: currentUser.uid, email: currentUser.email, role: 'student', name: currentUser.email.split('@')[0] });
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, name, role, teacherId = null) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Save user details to Firestore
    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    if (role === 'teacher' && teacherId) {
      userData.teacherId = teacherId;
    }
    
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } catch (err) {
      console.warn("Failed to save user document:", err);
    }
    
    localStorage.setItem(`zenith_user_${userCredential.user.uid}`, JSON.stringify(userData));
    setUser({ uid: userCredential.user.uid, ...userData });
    return role;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    let role = 'student';
    let name = email.split('@')[0];
    
    try {
      const docRef = doc(db, 'users', userCredential.user.uid);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );
      const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);
      
      if (docSnap.exists()) {
         role = docSnap.data().role;
         name = docSnap.data().name;
         localStorage.setItem(`zenith_user_${userCredential.user.uid}`, JSON.stringify(docSnap.data()));
      } else {
         const cached = localStorage.getItem(`zenith_user_${userCredential.user.uid}`);
         if (cached) {
            const parsed = JSON.parse(cached);
            role = parsed.role;
            name = parsed.name;
         }
      }
    } catch (err) {
      console.warn("Failed to get user document (timeout/offline), falling back:", err.message);
      const cached = localStorage.getItem(`zenith_user_${userCredential.user.uid}`);
      if (cached) {
         const parsed = JSON.parse(cached);
         role = parsed.role;
         name = parsed.name;
      }
    }
    
    setUser({ uid: userCredential.user.uid, email, name, role });
    return role;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
          <i className="fa-solid fa-graduation-cap" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px', animation: 'bounce 2s infinite' }}></i>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(124, 58, 237, 0.3)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '20px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Connecting to Zenith...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
