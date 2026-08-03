import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '80px' }}>
      <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '600px', width: '100%', animation: 'float 6s ease-in-out infinite' }}>
        <h1 style={{ fontSize: '8rem', margin: 0, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Lost in Space</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem' }}>
          The educational module you are looking for has drifted into the void. It might have been moved or no longer exists.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '15px 30px', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-rocket"></i> Return to Base
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
