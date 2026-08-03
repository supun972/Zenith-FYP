import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const chartRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Chart Mockup Generation
    const chartMockup = chartRef.current;
    if (chartMockup && chartMockup.children.length === 0) {
      for (let i = 0; i < 24; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const baseHeight = 60 + Math.random() * 35;
        bar.style.height = `${baseHeight}%`;
        
        setInterval(() => {
            const newHeight = Math.max(40, Math.min(100, baseHeight + (Math.random() * 20 - 10)));
            bar.style.height = `${newHeight}%`;
        }, 3000 + (Math.random() * 2000));
        
        chartMockup.appendChild(bar);
      }
    }

    // Intersection Observer
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('active');
              observer.unobserve(entry.target);
          }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, []);

  return (
    <>
      <header className="hero">
          <div className="container hero-content">
              <div className="section-tag">Grades 9-11 Digital Learning</div>
              <h1 dangerouslySetInnerHTML={{ __html: t('hero.title') }}></h1>
              <p>{t('hero.subtitle')}</p>
              <div className="hero-btns">
                  <Link to="/student" className="btn btn-primary">{t('hero.start')} <i className="fa-solid fa-arrow-right"></i></Link>
                  <Link to="/teacher" className="btn btn-secondary">{t('hero.demo')}</Link>
              </div>
              
              <div className="hero-dashboard glass-panel">
                  <div className="dashboard-img">
                      <div className="dashboard-mockup" style={{ display: 'flex', padding: '30px', gap: '20px', height: '100%', boxSizing: 'border-box' }}>
                          
                          {/* Left Panel */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid var(--primary)', textAlign: 'left' }}>
                              <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Biology: Cellular Respiration</h4>
                              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}><i className="fa-solid fa-circle-play" style={{ color: 'var(--primary)' }}></i> Live Session Active</p>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                               <div style={{ textAlign: 'center' }}>
                                 <i className="fa-solid fa-photo-film" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)', marginBottom: '15px' }}></i>
                                 <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Interactive Lecture Area</div>
                               </div>
                            </div>
                          </div>

                          {/* Right Panel - Analytics */}
                          <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <h3 style={{ fontSize: '0.9rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-eye" style={{ color: 'var(--secondary)' }}></i> Focus Level
                              </h3>
                              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>94%</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '5px' }}>+5% from last session</div>
                            </div>
                            
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'left' }}>Engagement Trend</div>
                              {/* Mock Chart */}
                               <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%' }} viewBox="0 0 100 50" preserveAspectRatio="none">
                                 <path d="M0,50 L0,20 Q25,10 50,25 T100,5 L100,50 Z" fill="var(--secondary)" opacity="0.2" />
                                 <path d="M0,20 Q25,10 50,25 T100,5" fill="none" stroke="var(--secondary)" strokeWidth="2" />
                               </svg>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </header>

      <section id="features" className="container">
          <div className="section-header reveal">
              <div className="section-tag">{t('feat.tag')}</div>
              <h2 dangerouslySetInnerHTML={{ __html: t('feat.title') }}></h2>
              <p>{t('feat.desc')}</p>
          </div>

          <div className="features-grid">
              <div className="feature-card glass-panel reveal">
                  <div className="feature-icon"><i className="fa-solid fa-stopwatch"></i></div>
                  <h3>{t('feat.1.t')}</h3>
                  <p>{t('feat.1.d')}</p>
              </div>
              <div className="feature-card glass-panel reveal" style={{transitionDelay: '0.1s'}}>
                  <div className="feature-icon"><i className="fa-solid fa-eye"></i></div>
                  <h3>{t('feat.2.t')}</h3>
                  <p>{t('feat.2.d')}</p>
              </div>
              <div className="feature-card glass-panel reveal" style={{transitionDelay: '0.2s'}}>
                  <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
                  <h3>{t('feat.3.t')}</h3>
                  <p>{t('feat.3.d')}</p>
              </div>
              <div className="feature-card glass-panel reveal" style={{transitionDelay: '0.3s'}}>
                  <div className="feature-icon"><i className="fa-solid fa-comments"></i></div>
                  <h3>{t('feat.4.t')}</h3>
                  <p>{t('feat.4.d')}</p>
              </div>
              <div className="feature-card glass-panel reveal" style={{transitionDelay: '0.4s'}}>
                  <div className="feature-icon"><i className="fa-solid fa-clipboard-check"></i></div>
                  <h3>{t('feat.5.t')}</h3>
                  <p>{t('feat.5.d')}</p>
              </div>
              <div className="feature-card glass-panel reveal" style={{transitionDelay: '0.5s'}}>
                  <div className="feature-icon"><i className="fa-solid fa-qrcode"></i></div>
                  <h3>{t('feat.6.t')}</h3>
                  <p>{t('feat.6.d')}</p>
              </div>
          </div>
      </section>

      <section id="how-it-works" className="container">
          <div className="section-header reveal">
              <div className="section-tag">{t('hw.tag')}</div>
              <h2 dangerouslySetInnerHTML={{ __html: t('hw.title') }}></h2>
              <p>{t('hw.desc')}</p>
          </div>
          <div className="workflow">
              <div className="step reveal">
                  <div className="step-content reveal reveal-left">
                      <h3>{t('hw.1.t')}</h3>
                      <p>Students enter the virtual classroom, select the assigned lesson, and define their intended study time. The AI breaks this down into optimal focus and rest intervals.</p>
                  </div>
                  <div className="step-number"><div className="num-circle">1</div></div>
                  <div className="step-image glass-panel reveal reveal-right"><i className="fa-solid fa-book-open"></i></div>
              </div>
              <div className="step reveal">
                  <div className="step-content reveal reveal-right">
                      <h3>{t('hw.2.t')}</h3>
                      <p>The study session begins. The interface minimizes distractions while the privacy-first attention engine runs locally to measure engagement without compromising security.</p>
                  </div>
                  <div className="step-number"><div className="num-circle">2</div></div>
                  <div className="step-image glass-panel reveal reveal-left"><i className="fa-solid fa-laptop-code"></i></div>
              </div>
              <div className="step reveal">
                  <div className="step-content reveal reveal-left">
                      <h3>{t('hw.3.t')}</h3>
                      <p>After completing the post-lesson quiz, students receive a personalized focus report. Teachers simultaneously get aggregate analytics to adjust future lesson plans.</p>
                  </div>
                  <div className="step-number"><div className="num-circle">3</div></div>
                  <div className="step-image glass-panel reveal reveal-right"><i className="fa-solid fa-chart-pie"></i></div>
              </div>
          </div>
      </section>

      <section id="roles" className="container">
          <div className="section-header reveal">
              <div className="section-tag">{t('roles.tag')}</div>
              <h2 dangerouslySetInnerHTML={{ __html: t('roles.title') }}></h2>
              <p>{t('roles.desc')}</p>
          </div>
          <div className="roles-container">
              <div className="role-card student glass-panel reveal reveal-left">
                  <div className="role-header">
                      <i className="fa-solid fa-user-graduate"></i>
                      <h3>{t('roles.student')}</h3>
                  </div>
                  <ul className="role-list">
                      <li><i className="fa-solid fa-check"></i> Distraction-free immersive study UI</li>
                      <li><i className="fa-solid fa-check"></i> Personalized achievement profiles</li>
                      <li><i className="fa-solid fa-check"></i> Direct secure chat with teachers</li>
                      <li><i className="fa-solid fa-check"></i> Own focus data visibility</li>
                      <li><i className="fa-solid fa-check"></i> Gamified break reminders</li>
                  </ul>
                  <Link to="/student" className="btn btn-secondary" style={{marginTop: '2rem', width: '100%'}}>Explore Student View</Link>
              </div>
              <div className="role-card teacher glass-panel reveal reveal-right">
                  <div className="role-header">
                      <i className="fa-solid fa-chalkboard-user"></i>
                      <h3>{t('roles.teacher')}</h3>
                  </div>
                  <ul className="role-list">
                      <li><i className="fa-solid fa-check"></i> 1-click virtual classroom generation</li>
                      <li><i className="fa-solid fa-check"></i> Live class engagement heatmaps</li>
                      <li><i className="fa-solid fa-check"></i> Automated intervention alerts</li>
                      <li><i className="fa-solid fa-check"></i> Lesson assignment and scheduling</li>
                      <li><i className="fa-solid fa-check"></i> Post-lesson comprehension analytics</li>
                  </ul>
                  <Link to="/teacher" className="btn btn-primary" style={{marginTop: '2rem', width: '100%'}}>Access Admin Demo</Link>
              </div>
          </div>
      </section>

      <section id="analytics" className="container">
          <div className="analytics-dashboard reveal">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem'}}>
                  <div>
                      <h3 style={{marginBottom: '0.5rem'}}>Live Class Analytics</h3>
                      <p style={{margin: 0}}>Grade 10 Biology - Cellular Respiration</p>
                  </div>
                  <div className="section-tag" style={{margin: 0, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)'}}>
                      <i className="fa-solid fa-circle" style={{fontSize: '0.6rem', marginRight: '0.5rem', animation: 'pulse 2s infinite'}}></i> Session Active
                  </div>
              </div>
              <div className="metrics-grid">
                  <div className="metric-card">
                      <div className="metric-label">Avg Class Focus</div>
                      <div className="metric-value good">87% <i className="fa-solid fa-arrow-trend-up" style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}></i></div>
                  </div>
                  <div className="metric-card">
                      <div className="metric-label">Active Students</div>
                      <div className="metric-value">28/30</div>
                  </div>
                  <div className="metric-card">
                      <div className="metric-label">Intervention Needed</div>
                      <div className="metric-value warning">2 <i className="fa-solid fa-triangle-exclamation" style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}></i></div>
                  </div>
              </div>
              <div>
                  <div className="metric-label" style={{marginBottom: '1rem'}}>Focus Trend (Last 15 Mins)</div>
                  <div className="chart-mockup" ref={chartRef}></div>
              </div>
              <div className="privacy-banner">
                  <i className="fa-solid fa-shield-halved"></i>
                  <p><strong>Privacy First:</strong> Attention metrics are generated via local facial landmark tracking. No video feeds are transmitted or stored on our servers. Consent is required before every session.</p>
              </div>
          </div>
      </section>
      
      <section className="cta-section">
          <div className="container cta-content reveal">
              <h2>Ready to Transform Your Classroom?</h2>
              <p style={{fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem'}}>Join forward-thinking educators using AI to create focused, effective, and privacy-respecting learning environments.</p>
              <div className="cta-btns">
                  <Link to="/register" className="btn btn-primary" style={{padding: '1rem 2.5rem', fontSize: '1.1rem'}}>Create Free Teacher Account</Link>
                  <Link to="/login" className="btn btn-secondary" style={{padding: '1rem 2.5rem', fontSize: '1.1rem'}}>Enter Class Code</Link>
              </div>
          </div>
      </section>
    </>
  );
};

export default LandingPage;
