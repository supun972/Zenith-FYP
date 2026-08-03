import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const navRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navRef.current?.classList.add('scrolled');
      } else {
        navRef.current?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav ref={navRef} id="navbar">
      <Link to="/" className="logo">
          <i className="fa-solid fa-graduation-cap"></i>
          ZENITH
      </Link>
      <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} id="navLinks">
          {isHome ? (
            <>
              <li><a href="#features" onClick={() => setIsMenuOpen(false)}>{t('nav.features')}</a></li>
              <li><a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{t('nav.about')}</a></li>
              <li><a href="#roles" onClick={() => setIsMenuOpen(false)}>For Teachers</a></li>
              <li><a href="#analytics" onClick={() => setIsMenuOpen(false)}>Analytics</a></li>
            </>
          ) : (
            <>
              <li><Link to="/" onClick={() => setIsMenuOpen(false)}>{t('nav.home')}</Link></li>
            </>
          )}
          {isMenuOpen && (
              <li className="mobile-only"><Link to="/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link></li>
          )}
      </ul>
      <div className="nav-actions">
          <select 
            onChange={changeLanguage} 
            value={i18n.language} 
            style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', marginRight: '10px' }}
          >
            <option value="en" style={{ color: 'black' }}>EN</option>
            <option value="si" style={{ color: 'black' }}>සිංහල</option>
            <option value="ta" style={{ color: 'black' }}>தமிழ்</option>
          </select>
          {user ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to={user.role === 'admin' ? "/admin" : user.role === 'teacher' ? "/teacher" : "/student"} className="btn btn-primary" style={{padding: '0.5rem 1.2rem'}}>
                Dashboard
              </Link>
              <Link to="/profile" className="btn btn-secondary" style={{padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <i className="fa-solid fa-user-circle"></i> {user.name}
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{padding: '0.5rem 1.2rem'}}>{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary" style={{padding: '0.5rem 1.2rem'}}>{t('nav.register')}</Link>
            </>
          )}
      </div>
      <button className="menu-toggle" onClick={toggleMenu}>
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
      </button>
    </nav>
  );
};

export default Navbar;
