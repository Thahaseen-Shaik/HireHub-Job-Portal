import { useId, useState } from 'react';
import ContactForm from './ContactForm';
import styles from './OpeningPage.module.css';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Jobs', href: '#jobs' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'Employers', href: '#employers' },
  { label: 'Contact', href: '#contact', action: 'contact' }
];

const featuredJobs = [
  {
    title: 'Frontend Developer',
    company: 'NovaPay',
    location: 'Remote',
    type: 'Full-time',
    salary: 'Rs. 10 - 16 LPA',
    tag: 'React'
  },
  {
    title: 'Product Designer',
    company: 'CloudFrame',
    location: 'Bengaluru',
    type: 'Hybrid',
    salary: 'Rs. 12 - 18 LPA',
    tag: 'UI/UX'
  },
  {
    title: 'Data Analyst',
    company: 'MetricLoop',
    location: 'Hyderabad',
    type: 'Full-time',
    salary: 'Rs. 8 - 12 LPA',
    tag: 'SQL'
  }
];

const benefits = [
  {
    title: 'Smart job matching',
    description:
      'Find roles that fit your skills, preferred salary, location, and experience without endless scrolling.',
    icon: 'search'
  },
  {
    title: 'Apply in seconds',
    description:
      'Save your profile once and submit tailored applications quickly across multiple openings.',
    icon: 'apply'
  },
  {
    title: 'For growing teams',
    description:
      'Post vacancies, manage applicants, and keep hiring teams aligned in one simple portal.',
    icon: 'team'
  }
];

const employerStats = [
  { value: '2.5K+', label: 'Active candidates' },
  { value: '180+', label: 'Hiring companies' },
  { value: '90%', label: 'Faster shortlisting' }
];

const quickFilters = ['Remote', 'Fresher', 'Full-time', 'Internship', 'Design', 'Engineering'];

const LogoMark = () => {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 48 48" className={styles.logoMark} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${gradientId})`} opacity="0.12" />
      <path
        d="M14 18.5h20a3 3 0 0 1 3 3V32a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V21.5a3 3 0 0 1 3-3Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M17 18.5v-2.2A2.3 2.3 0 0 1 19.3 14h9.4a2.3 2.3 0 0 1 2.3 2.3v2.2"
        fill="none"
        stroke="var(--primary-color)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="26.5" r="2.2" fill="#F59E0B" />
      <path d="M24 26.5h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const FeatureIcon = ({ kind }) => {
  const commonProps = {
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none'
  };

  if (kind === 'search') {
    return (
      <svg viewBox="0 0 48 48" className={styles.sectionIcon} aria-hidden="true">
        <circle cx="20" cy="20" r="10" fill="currentColor" opacity="0.12" />
        <circle cx="20" cy="20" r="10" {...commonProps} />
        <path d="M27 27l7 7" {...commonProps} />
      </svg>
    );
  }

  if (kind === 'apply') {
    return (
      <svg viewBox="0 0 48 48" className={styles.sectionIcon} aria-hidden="true">
        <path
          d="M15 10h13l5 5v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z"
          fill="currentColor"
          opacity="0.12"
        />
        <path
          d="M15 10h13l5 5v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z"
          {...commonProps}
        />
        <path d="M18 24h12M18 29h8" {...commonProps} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={styles.sectionIcon} aria-hidden="true">
      <path
        d="M12 34V20m8 14V14m8 20V18m8 16V24"
        stroke="var(--primary-color)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M10 12h8m6 0h14" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

const OpeningPage = ({ onLogin, onRegister }) => {
  const { theme, setTheme, themes: themeNames } = useTheme();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const closeContact = () => setContactOpen(false);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNavClick = (event, link) => {
    event.preventDefault();
    closeMenu();

    if (link.action === 'contact') {
      setContactOpen((prev) => {
        const next = !prev;
        if (!prev) {
          window.setTimeout(() => scrollToSection('contact'), 0);
        }
        return next;
      });
      return;
    }

    closeContact();
    scrollToSection(link.href.replace('#', ''));
  };

  const handleFooterContactClick = (event) => {
    event.preventDefault();
    setContactOpen(true);
    window.setTimeout(() => scrollToSection('contact'), 0);
  };

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <a className={styles.brand} href="#home" onClick={closeMenu}>
          <LogoMark />
          <span>
            <strong>{settings?.platform_name || 'Shnoor HireHub'}</strong>
            <small>{settings?.tagline || 'Find work. Build teams. Grow faster.'}</small>
          </span>
        </a>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={(event) => handleNavClick(event, link)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.navActions}>
          <button type="button" className={styles.registerBtn} onClick={onRegister}>
            Register
          </button>
          <button type="button" className={styles.loginBtn} onClick={onLogin}>
            Login
          </button>
        </div>
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.kicker}>Real jobs. Real people. Real hiring.</span>
            <h1>{settings?.hero_title || (settings?.platform_name ? `${settings.platform_name} Job Portal` : 'Shnoor HireHub Job Portal')}</h1>
            <p>
              Discover verified jobs, connect with growing companies, and apply faster with a
              modern job portal built for everyday use.
            </p>

            <div className={styles.quickFilters} aria-label="Quick job filters">
              {quickFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={styles.filterChip}
                  onClick={() => scrollToSection('jobs')}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => scrollToSection('jobs')}
              >
                Explore Jobs
              </button>
              <button type="button" className={styles.secondaryAction} onClick={onLogin}>
                Login
              </button>
            </div>

            <div className={styles.heroStats} aria-label="Portal highlights">
              <div>
                <strong>1,200+</strong>
                <span>Live openings</span>
              </div>
              <div>
                <strong>350+</strong>
                <span>Hiring companies</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Access and updates</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroIllustration}>
              <div className={styles.featuredBadge}>Live jobs updated daily</div>
              <div className={styles.heroJobCard}>
                <div className={styles.jobCardTop}>
                  <span>Remote</span>
                  <strong>Top match</strong>
                </div>
                <h3>Frontend Developer</h3>
                <p>NovaPay | React | Full-time</p>
                <div className={styles.salaryRow}>
                  <strong>Rs. 10 - 16 LPA</strong>
                  <span>Apply in 2 min</span>
                </div>
              </div>

              <div className={styles.heroCompanyStrip}>
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className={styles.heroMiniGrid}>
                <div>
                  <strong>Saved</strong>
                  <span>Recommended roles</span>
                </div>
                <div>
                  <strong>Shortlist</strong>
                  <span>Fast recruiter view</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="jobs" className={styles.section}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionTag}>Featured jobs</span>
            <h2>Jobs that fit the way people work today</h2>
            <p>Browse fresh openings across remote, hybrid, and office-first roles.</p>
          </div>

          <div className={styles.jobGrid}>
            {featuredJobs.map((job) => (
              <article key={job.title} className={styles.jobCard}>
                <div className={styles.jobMeta}>
                  <span className={styles.jobTag}>{job.tag}</span>
                  <span className={styles.jobType}>{job.type}</span>
                </div>
                <h3>{job.title}</h3>
                <p className={styles.jobCompany}>{job.company}</p>
                <div className={styles.jobDetails}>
                  <span>{job.location}</span>
                  <span>{job.salary}</span>
                </div>
                <button type="button" className={styles.applyBtn} onClick={onRegister}>
                  Apply Now
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="why-us" className={`${styles.section} ${styles.altSection}`}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionTag}>Why {settings?.platform_name || 'Shnoor HireHub'}</span>
            <h2>Built for real job seekers and real employers</h2>
            <p>Simple discovery for candidates, efficient hiring tools for recruiters.</p>
          </div>

          <div className={styles.benefitGrid}>
            {benefits.map((item) => (
              <article key={item.title} className={styles.benefitCard}>
                <FeatureIcon kind={item.icon} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="employers" className={styles.section}>
          <div className={styles.employerGrid}>
            <div className={styles.employerPanel}>
              <span className={styles.sectionTag}>For employers</span>
              <h2>Post jobs, track applicants, and hire with confidence</h2>
              <p>
                Manage open roles, review candidate pipelines, and keep your recruiting process
                organized from one dashboard.
              </p>

              <div className={styles.statsStrip}>
                {employerStats.map((stat) => (
                  <div key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.employerPanelList}>
              <div className={styles.panelRow}>
                <span>Candidate screening</span>
                <strong>Shortlist faster</strong>
              </div>
              <div className={styles.panelRow}>
                <span>Job posting</span>
                <strong>Publish in minutes</strong>
              </div>
              <div className={styles.panelRow}>
                <span>Hiring updates</span>
                <strong>Stay in sync</strong>
              </div>
            </div>
          </div>
        </section>

        {contactOpen && (
          <section id="contact" className={`${styles.section} ${styles.contactSection}`}>
            <div className={styles.contactLayout}>
              <div className={styles.contactCopy}>
                <span className={styles.sectionTag}>Contact</span>
                <h2>Need help with hiring or applications?</h2>
                <p>
                  Send us a message and our team will respond with the right support for job seekers
                  and employers.
                </p>

                <div className={styles.contactPoints}>
                  <div>
                    <strong>For job seekers</strong>
                    <span>Ask about profiles, applications, and account access.</span>
                  </div>
                  <div>
                    <strong>For employers</strong>
                    <span>Get help with job posting, applicants, and employer tools.</span>
                  </div>
                </div>

                <div className={styles.contactActions}>
                  <button type="button" className={styles.primaryAction} onClick={onRegister}>
                    Create Account
                  </button>
                  <button type="button" className={styles.secondaryAction} onClick={onLogin}>
                    Login
                  </button>
                </div>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactCardHeader}>
                  <strong>Send a message</strong>
                  <button type="button" className={styles.closeContactBtn} onClick={closeContact}>
                    Close
                  </button>
                </div>
                <ContactForm />
              </div>
            </div>
          </section>
        )}
        <section className={styles.themeSection}>
          <div className={styles.themeHeader}>
            <span className={styles.themeBadge}>Personalization</span>
            <h2>Choose Your Theme</h2>
            <p className={styles.themeSubtitle}>
              Pick a visual style that matches your taste. Applied instantly across the entire platform.
            </p>
          </div>

          <div className={styles.themeGridCustom}>
            {[
              { id: themeNames.DEFAULT, name: 'Default', previewClass: styles.previewDefault },
              { id: themeNames.ARCTIC, name: 'Arctic Command', previewClass: styles.previewArctic },
              { id: themeNames.EMBER, name: 'Ember Ledger', previewClass: styles.previewEmber },
              { id: themeNames.FOREST, name: 'Forest Growth', previewClass: styles.previewForest }
            ].map((t) => (
              <div
                key={t.id}
                className={`${styles.themeCard} ${theme === t.id ? styles.themeActive : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <div className={`${styles.themePreviewLarge} ${t.previewClass}`}>
                  <div className={styles.previewBar}></div>
                  <div className={styles.previewBlock}></div>
                  {theme === t.id && (
                    <div className={styles.activeIndicator}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.themeCardFooter}>
                  <h3>{t.name}</h3>
                </div>
              </div>
            ))}
          </div>

        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <LogoMark />
          <div>
            <strong>{settings?.platform_name || 'Shnoor HireHub'}</strong>
            <p>{settings?.footer_text || 'Your everyday job portal for smarter hiring'}</p>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <a href="#jobs">Jobs</a>
          <a href="#why-us">Why {settings?.platform_name || 'Shnoor HireHub'}</a>
          <a href="#employers">Employers</a>
          <a href="#contact" onClick={handleFooterContactClick}>Contact</a>
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

export default OpeningPage;
