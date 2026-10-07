/* ==========================================================================
   MUHAMMAD WAEL ALKHADRAA - INTERACTIVE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const scrollTrack = document.getElementById('scrollTrack');
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingText = document.getElementById('loadingText');
  const progressBar = document.getElementById('progressBar');
  const scrollHint = document.getElementById('scrollHint');
  const bgVideoContainer = document.getElementById('bgVideoContainer');
  const bgVideo = document.getElementById('bgVideo');
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinksList = document.getElementById('navLinks');

  // Animation State
  const images = [];
  let totalFrames = 0;
  let loadedCount = 0;
  let currentFrame = 0;
  let isReady = false;

  // Skip intro animation & show main content directly
  function skipIntroAnimation() {
    isReady = true;
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
    if (scrollTrack) scrollTrack.style.display = 'none';
    if (bgVideoContainer) bgVideoContainer.classList.add('active');
    if (navbar) navbar.classList.add('visible');
  }

  // Failsafe: if loading takes more than 12 seconds, skip animation
  const loadingTimeout = setTimeout(() => {
    if (!isReady) {
      console.warn('Frame loading timed out — skipping intro animation.');
      skipIntroAnimation();
    }
  }, 12000);

  // Robust video setup & continuous looping
  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.loop = true;
    bgVideo.playsInline = true;

    // Handle video end to restart seamlessly
    bgVideo.addEventListener('ended', () => {
      bgVideo.currentTime = 0;
      bgVideo.play().catch(() => {});
    });

    const startVideo = () => {
      bgVideo.play().catch(err => console.log('Autoplay attempt:', err));
    };

    startVideo();
    document.addEventListener('touchstart', startVideo, { once: true });
    document.addEventListener('click', startVideo, { once: true });
  }

  // 1. Preload Animation Frames
  function initFrames() {
    if (!window.FRAMES || !Array.isArray(window.FRAMES) || window.FRAMES.length === 0) {
      console.warn('FRAMES data missing — skipping intro animation.');
      skipIntroAnimation();
      return;
    }

    totalFrames = window.FRAMES.length;

    window.FRAMES.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        if (i === 0) {
          drawFrame(0);
        }
        if (loadedCount === totalFrames) {
          onAllLoaded();
        } else if (loadingText) {
          loadingText.textContent = `Loading interactive intro… ${Math.round((loadedCount / totalFrames) * 100)}%`;
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) onAllLoaded();
      };
      img.src = src;
    });
  }

  function onAllLoaded() {
    clearTimeout(loadingTimeout);
    isReady = true;
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
    updateScroll();
  }

  // 2. Draw Frame on Canvas
  function drawFrame(index) {
    if (!ctx || !images[index]) return;
    const img = images[index];

    // Canvas resolution match
    if (canvas.width !== 1920 || canvas.height !== 1080) {
      canvas.width = 1920;
      canvas.height = 1080;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cover
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
    );
  }

  // 3. Scroll Handler
  function updateScroll() {
    if (!scrollTrack) return;

    const trackRect = scrollTrack.getBoundingClientRect();
    const scrollableDistance = trackRect.height - window.innerHeight;
    const scrolled = -trackRect.top;

    let fraction = scrolled / scrollableDistance;
    fraction = Math.max(0, Math.min(1, fraction));

    // Update Progress Bar
    if (progressBar) {
      progressBar.style.width = `${fraction * 100}%`;
    }

    // Scroll Hint Fade Out
    if (scrollHint) {
      if (fraction > 0.1) {
        scrollHint.style.opacity = '0';
      } else {
        scrollHint.style.opacity = '1';
      }
    }

    // Frame Index
    if (isReady && totalFrames > 0) {
      const frameIndex = Math.min(
        totalFrames - 1,
        Math.floor(fraction * totalFrames)
      );

      if (frameIndex !== currentFrame) {
        currentFrame = frameIndex;
        drawFrame(currentFrame);
      }
    }

    // Background Video & Navbar visibility when reaching main content (End of intro)
    if (fraction >= 0.75 || trackRect.bottom <= window.innerHeight + 100) {
      if (bgVideoContainer) {
        bgVideoContainer.classList.add('active');
        if (bgVideo) {
          if (bgVideo.paused || bgVideo.ended) {
            if (bgVideo.ended) bgVideo.currentTime = 0;
            bgVideo.play().catch(e => console.log('Video play error:', e));
          }
        }
      }
      if (navbar) navbar.classList.add('visible');
    } else {
      if (bgVideoContainer) bgVideoContainer.classList.remove('active');
      if (navbar) navbar.classList.remove('visible');
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateScroll);

  // 4. Mobile Navigation Toggle
  if (navToggle && navLinksList) {
    navToggle.addEventListener('click', () => {
      navLinksList.classList.toggle('open');
    });
  }

  // Close nav on click & immediate active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function () {
      if (navLinksList) navLinksList.classList.remove('open');
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 5. Scroll Spy for Active Nav Links (Using getBoundingClientRect for viewport accuracy)
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    let current = '';
    const triggerOffset = 220; // 220px below viewport top (accounts for navbar)

    // Check if scrolled near the bottom of document
    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 70);

    if (isAtBottom) {
      current = 'contact';
    } else {
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        // Section is active if it spans across the trigger offset line
        if (rect.top <= triggerOffset && rect.bottom > triggerOffset) {
          current = sec.getAttribute('id');
        }
      });

      // Fallback: If at the top of content before passing triggerOffset
      if (!current && sections.length > 0) {
        const firstRect = sections[0].getBoundingClientRect();
        if (firstRect.top > 0 && firstRect.top < window.innerHeight) {
          current = sections[0].getAttribute('id');
        }
      }
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (current && href === `#${current}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  // 6. Project Category Filter
  const projectFilterBtns = document.querySelectorAll('.project-filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  projectFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      projectFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        if (cat === 'all' || categories.includes(cat)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });

  // 7. Skills Category Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-filter');

      skillCards.forEach(card => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });

  // 8. Interactive CLI Terminal
  const termOutput = document.getElementById('termOutput');
  const termInput = document.getElementById('termInput');
  const termBtns = document.querySelectorAll('.term-btn');

  const COMMANDS = {
    help: 'Available commands: <strong>summary</strong>, <strong>projects</strong>, <strong>skills</strong>, <strong>experience</strong>, <strong>ktc</strong>, <strong>rfid</strong>, <strong>education</strong>, <strong>contact</strong>, <strong>clear</strong>',
    summary: '<strong>Muhammad Wael AlKhadraa</strong> - IT Specialist | Support Engineer | .NET Developer.<br>Experienced in enterprise IT support, Windows admin, hardware/network troubleshooting, Sophos firewall, and full-stack web dev (.NET/Angular).',
    projects: '<div class="term-section-title">🚀 Featured Engineering & Enterprise Projects</div>' +
      '<div class="term-project-block">' +
        '<div class="term-project-head"><span class="term-dot"></span><strong>IT Incident Copilot</strong> <span class="term-tag">AI Service Desk</span></div>' +
        '<div class="term-project-desc">Autonomous Telemetry Diagnostics & Automated Remediation Engine (React 18, ASP.NET Core 9, pgvector)</div>' +
        '<div class="term-project-links"><a href="https://it-incident-copilot.vercel.app" target="_blank">🌐 Live Demo</a> &bull; <a href="https://github.com/muhammadalkhadraa/IT-Incident-Copilot" target="_blank">🐙 GitHub Repo</a></div>' +
      '</div>' +
      '<div class="term-divider"></div>' +
      '<div class="term-project-block">' +
        '<div class="term-project-head"><span class="term-dot dot-purple"></span><strong>RFID + Barcode Textile Tracker</strong> <span class="term-tag tag-purple">.NET 8 Clean Architecture</span></div>' +
        '<div class="term-project-desc">High-Throughput Production-Grade Manufacturing Architecture (C#, EF Core, SQL Server, Impinj RFID SDK)</div>' +
        '<div class="term-project-links"><a href="https://github.com/muhammadalkhadraa/rfid-tracker" target="_blank">🐙 GitHub Solution</a></div>' +
      '</div>' +
      '<div class="term-divider"></div>' +
      '<div class="term-project-block">' +
        '<div class="term-project-head"><span class="term-dot dot-emerald"></span><strong>KTC Vacations & HR Portal</strong> <span class="term-tag tag-emerald">Corporate HR Portal</span></div>' +
        '<div class="term-project-desc">Corporate Leave Management & Employee Self-Service Platform (Angular 17, Ionic, Supabase PostgreSQL, i18n)</div>' +
        '<div class="term-project-links"><a href="https://ktc-vacations.vercel.app" target="_blank">🌐 Live Demo</a> &bull; <a href="https://github.com/muhammadalkhadraa/KTC-VACATIONS" target="_blank">🐙 GitHub Repo</a></div>' +
      '</div>' +
      '<div class="term-divider"></div>' +
      '<div class="term-project-block">' +
        '<div class="term-project-head"><span class="term-dot dot-rose"></span><strong>Togetheer</strong> <span class="term-tag tag-rose">WebRTC & Multimedia</span></div>' +
        '<div class="term-project-desc">A Little Closer, Wherever You Are — Private Room for Friends (WebRTC, Watch Party, 100-Piece Bézier Puzzle)</div>' +
        '<div class="term-project-links"><a href="https://togetheer.vercel.app" target="_blank">🌐 Live Demo</a> &bull; <a href="https://github.com/muhammadalkhadraa/togetheer" target="_blank">🐙 GitHub Repo</a></div>' +
      '</div>',
    skills: '<strong>Core Technical Stack:</strong><br>• IT Support, Windows Admin, Printer/Scanner, TCP/IP, IP Address Mgmt, Sophos Firewall<br>• C#, .NET Core, ASP.NET MVC, Angular, SQL Server, PostgreSQL, Supabase<br>• Git/GitHub, Microsoft Power Automate, n8n Automation',
    experience: '<strong>Work Experience:</strong><br>1. Kazareen Textile Company (KTC) - IT Specialist & Web Developer (2025–Present)<br>2. RFID Company - Full Stack Web Developer (2024–2025)',
    ktc: '<strong>Kazareen Textile Company (KTC):</strong><br>Daily employee IT support, hardware repair, network/Sophos firewall mgmt, .NET/Angular app dev, n8n/Power Automate payroll email automation workflows.',
    rfid: '<strong>RFID Company:</strong><br>Developed enterprise web apps with .NET Core, ASP.NET MVC, Angular, C#, and SQL Server. Designed REST APIs.',
    education: '<strong>Education:</strong><br>Sadat Academy for Management Sciences - Bachelor of Science in Computer Science (2020 – 2024)',
    contact: '<strong>Contact Information & Socials:</strong><br>💼 LinkedIn: <a href="https://www.linkedin.com/in/muhammad-alkhadraa" target="_blank" style="color:var(--accent-cyan); text-decoration:underline;">linkedin.com/in/muhammad-alkhadraa</a><br>🐙 GitHub: <a href="https://github.com/muhammadalkhadraa" target="_blank" style="color:var(--accent-cyan); text-decoration:underline;">github.com/muhammadalkhadraa</a><br>📞 Phone: 01005421228<br>✉️ Email: alkhadraam@gmail.com'
  };

  function handleCommand(cmd) {
    const cleanCmd = cmd.trim().toLowerCase();
    if (!cleanCmd) return;

    // Create prompt line
    const promptDiv = document.createElement('div');
    promptDiv.className = 'terminal-line';
    promptDiv.innerHTML = `<span class="term-prompt">alkhadraa@ktc-net</span>:<span class="term-path">~</span>$ ${cleanCmd}`;
    termOutput.appendChild(promptDiv);

    if (cleanCmd === 'clear') {
      termOutput.innerHTML = '';
    } else if (COMMANDS[cleanCmd]) {
      const outDiv = document.createElement('div');
      outDiv.className = 'term-output';
      outDiv.innerHTML = COMMANDS[cleanCmd];
      termOutput.appendChild(outDiv);
    } else {
      const errDiv = document.createElement('div');
      errDiv.className = 'term-output';
      errDiv.style.color = '#f87171';
      errDiv.innerHTML = `Command not recognized: '${cleanCmd}'. Type <strong>help</strong> for available commands.`;
      termOutput.appendChild(errDiv);
    }

    termOutput.scrollTop = termOutput.scrollHeight;
  }

  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleCommand(termInput.value);
        termInput.value = '';
      }
    });
  }

  termBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      handleCommand(cmd);
    });
  });

  // 8. Copy to Clipboard & Toast
  window.copyText = function (text, label) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`);
    }).catch(() => {
      showToast(`Copied: ${text}`);
    });
  };

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 9. IntersectionObserver for Section Fade-Ins
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(sec => observer.observe(sec));

  // ── Lazy-load frames.js AFTER page is visible ──────────────────────────
  // The loading screen is already shown, so the user sees something instantly.
  // frames.js (3.7 MB) is fetched in the background; once ready, initFrames() runs.
  function loadFramesScript() {
    const script = document.createElement('script');
    script.src = 'frames.js';
    script.async = true;

    script.onload = () => {
      initFrames(); // FRAMES array is now available
    };

    script.onerror = () => {
      console.warn('frames.js failed to load — skipping intro animation.');
      skipIntroAnimation();
    };

    document.head.appendChild(script);
  }

  // Kick off lazy load once the browser has painted the initial frame
  if (document.readyState === 'complete') {
    loadFramesScript();
  } else {
    window.addEventListener('load', loadFramesScript);
  }
})();

