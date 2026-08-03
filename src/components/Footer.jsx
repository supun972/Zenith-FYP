import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
        <div className="footer-grid">
            <div className="footer-col">
                <Link to="/" className="logo" style={{marginBottom: '1rem', display: 'inline-flex'}}>
                    <i className="fa-solid fa-graduation-cap"></i>
                    ZENITH
                </Link>
                <p>Next-generation digital learning platform leveraging AI to improve student focus and empower teachers with actionable insights.</p>
                <div className="social-links">
                    <a href="#"><i className="fa-brands fa-twitter"></i></a>
                    <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
                    <a href="#"><i className="fa-brands fa-discord"></i></a>
                </div>
            </div>
            <div className="footer-col">
                <h4>Platform</h4>
                <ul className="footer-links">
                    <li><Link to="/student">Student Portal</Link></li>
                    <li><Link to="/teacher">Teacher Dashboard</Link></li>
                    <li><Link to="/analytics">Attention Analytics</Link></li>
                    <li><Link to="/pricing">Pricing</Link></li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>Resources</h4>
                <ul className="footer-links">
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">Pedagogy Guide</a></li>
                    <li><a href="#">Webinars</a></li>
                    <li><a href="#">Blog</a></li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>Trust & Legal</h4>
                <ul className="footer-links">
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                    <li><a href="#">Data Security</a></li>
                    <li><a href="#">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        <div className="footer-bottom">
            &copy; {new Date().getFullYear()} ZENITH Learning Technologies. All rights reserved.
        </div>
    </footer>
  );
};

export default Footer;
