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

  // Close nav on click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinksList) navLinksList.classList.remove('open');
    });
  });

  // 5. Scroll Spy for Active Nav Links
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 150;
      const height = sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        current = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // 6. Skills Category Filter
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

  // 7. Interactive CLI Terminal
  const termOutput = document.getElementById('termOutput');
  const termInput = document.getElementById('termInput');
  const termBtns = document.querySelectorAll('.term-btn');

  const COMMANDS = {
    help: 'Available commands: <strong>summary</strong>, <strong>skills</strong>, <strong>experience</strong>, <strong>ktc</strong>, <strong>rfid</strong>, <strong>education</strong>, <strong>contact</strong>, <strong>clear</strong>',
    summary: '<strong>Muhammad Wael AlKhadraa</strong> - IT Specialist | Support Engineer | .NET Developer.<br>Experienced in enterprise IT support, Windows admin, hardware/network troubleshooting, Sophos firewall, and full-stack web dev (.NET/Angular).',
    skills: '<strong>Core Technical Stack:</strong><br>• IT Support, Windows Admin, Printer/Scanner, TCP/IP, IP Address Mgmt, Sophos Firewall<br>• C#, .NET Core, ASP.NET MVC, Angular, SQL Server, PostgreSQL, Supabase<br>• Git/GitHub, Microsoft Power Automate, n8n Automation',
    experience: '<strong>Work Experience:</strong><br>1. Kazareen Textile Company (KTC) - IT Specialist & Web Developer (2025–Present)<br>2. RFID Company - Full Stack Web Developer (2024–2025)',
    ktc: '<strong>Kazareen Textile Company (KTC):</strong><br>Daily employee IT support, hardware repair, network/Sophos firewall mgmt, .NET/Angular app dev, n8n/Power Automate payroll email automation workflows.',
    rfid: '<strong>RFID Company:</strong><br>Developed enterprise web apps with .NET Core, ASP.NET MVC, Angular, C#, and SQL Server. Designed REST APIs.',
    education: '<strong>Education:</strong><br>Sadat Academy for Management Sciences - Bachelor of Science in Computer Science (2020 – 2024)',
    contact: '<strong>Contact Information:</strong><br>📞 Phone: 01005421228<br>✉️ Email: alkhadraam@gmail.com'
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

  // Initialize frame loader
  initFrames();
})();
