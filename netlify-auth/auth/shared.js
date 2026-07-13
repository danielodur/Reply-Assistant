(function () {
  const STRINGS = {
    en: {
      loading: 'Confirming your email…',
      loadingRecovery: 'Preparing password reset…',
      loadingMagic: 'Signing you in…',
      welcome: 'Welcome',
      welcomeName: 'Welcome, {{name}}',
      welcomeBack: 'Welcome back',
      verifiedSignup: 'Your email is verified. Open Reply Assistant to sign in and start working.',
      verifiedEmail: 'Your email is confirmed. Open Reply Assistant on this device.',
      verifiedInvite: 'Your account is ready. Open Reply Assistant to continue.',
      verifiedMagic: 'You are signed in. Open Reply Assistant to continue.',
      verifiedEmailChange: 'Your new email is confirmed. Open Reply Assistant to continue.',
      openApp: 'Open Reply Assistant',
      openAppSignIn: 'Open app and sign in',
      openAppHint: 'If the app does not open, launch Reply Assistant from your desktop and sign in.',
      errorTitle: 'Link expired',
      errorBody: 'This link is no longer valid. Request a new verification or reset email from the app.',
      backToApp: 'Return to the app',
      resetTitle: 'Choose a new password',
      resetSubtitle: 'Enter a new password for your account.',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      updatePassword: 'Update password',
      passwordUpdated: 'Password updated. Open Reply Assistant and sign in with your new password.',
      mismatch: 'Passwords do not match.',
      weak: 'Weak password',
      strong: 'Strong password',
      passwordsMatch: 'Passwords match',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      working: 'Working…',
      landingTitle: 'Reply Assistant',
      landingSubtitle: 'Open the app on your computer, then use the link from your email to continue here.',
      landingOpenApp: 'Open Reply Assistant',
      landingFootnote: 'Verification and password-reset links from your email open on this page automatically.',
    },
    zh: {
      loading: '正在确认您的邮箱…',
      loadingRecovery: '正在准备重置密码…',
      loadingMagic: '正在登录…',
      welcome: '欢迎',
      welcomeName: '欢迎，{{name}}',
      welcomeBack: '欢迎回来',
      verifiedSignup: '邮箱已验证。请打开 Reply Assistant 并登录开始使用。',
      verifiedEmail: '邮箱已确认。请在本设备打开 Reply Assistant。',
      verifiedInvite: '账户已就绪。请打开 Reply Assistant 继续。',
      verifiedMagic: '您已登录。请打开 Reply Assistant 继续。',
      verifiedEmailChange: '新邮箱已确认。请打开 Reply Assistant 继续。',
      openApp: '打开 Reply Assistant',
      openAppSignIn: '打开应用并登录',
      openAppHint: '若未自动打开，请从桌面启动 Reply Assistant 并登录。',
      errorTitle: '链接已失效',
      errorBody: '此链接已过期或已使用。请在应用中重新申请验证或重置邮件。',
      backToApp: '返回应用',
      resetTitle: '设置新密码',
      resetSubtitle: '为您的账户输入新密码。',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      updatePassword: '更新密码',
      passwordUpdated: '密码已更新。请打开 Reply Assistant 并用新密码登录。',
      mismatch: '两次密码不一致。',
      weak: '密码强度不足',
      strong: '密码强度良好',
      passwordsMatch: '两次密码一致',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      working: '处理中…',
      landingTitle: 'Reply Assistant',
      landingSubtitle: '请在电脑上打开应用，然后使用邮件中的链接回到此页继续。',
      landingOpenApp: '打开 Reply Assistant',
      landingFootnote: '邮件中的验证或重置链接会自动在此页完成。',
    },
  };

  function lang() {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'zh') return q;
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('zh')) return 'zh';
    return 'zh';
  }

  function syncDocumentLanguage() {
    document.documentElement.lang = lang() === 'zh' ? 'zh-CN' : 'en';
  }

  function languageToggleLabel() {
    return lang() === 'zh' ? 'En' : '中文';
  }

  function toggleLang() {
    const next = lang() === 'zh' ? 'en' : 'zh';
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState({}, '', url);
    syncDocumentLanguage();
    return next;
  }

  function mountLanguageToggle(buttonId, onChange) {
    const button = document.getElementById(buttonId);
    if (!button) return () => {};

    const sync = () => {
      button.textContent = languageToggleLabel();
      button.setAttribute(
        'aria-label',
        lang() === 'zh' ? 'Switch to English' : '切换到中文',
      );
    };

    button.addEventListener('click', () => {
      toggleLang();
      sync();
      if (typeof onChange === 'function') onChange();
    });

    sync();
    syncDocumentLanguage();
    return sync;
  }

  function t(key, vars) {
    let text = STRINGS[lang()][key] || STRINGS.en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    return text;
  }

  function getConfig() {
    if (!window.AUTH_CONFIG?.supabaseUrl || !window.AUTH_CONFIG?.supabaseAnonKey) {
      throw new Error('Missing AUTH_CONFIG — run npm run netlify-auth:config');
    }
    return window.AUTH_CONFIG;
  }

  function createClient() {
    const cfg = getConfig();
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  function parseHashParams() {
    const raw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(raw);
  }

  function parseSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  function firstNameFromUser(user) {
    const meta = user?.user_metadata || {};
    const name = String(meta.display_name || meta.full_name || meta.name || '').trim();
    if (!name) return '';
    return name.split(/\s+/)[0];
  }

  function buildDeepLink(session, type) {
    const cfg = getConfig();
    const hash = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      type: type || 'signup',
    }).toString();
    return `${cfg.appDeepLinkBase}#${hash}`;
  }

  function buildAppDeepLinkWithoutSession() {
    return getConfig().appDeepLinkBase;
  }

  function getAuthType() {
    const hash = parseHashParams();
    return hash.get('type') || parseSearchParams().get('type') || 'signup';
  }

  function hasAuthPayload() {
    const hash = parseHashParams();
    const search = parseSearchParams();
    return (
      hash.has('access_token')
      || hash.has('error')
      || hash.has('error_code')
      || search.has('code')
      || search.has('error')
      || search.has('error_description')
    );
  }

  function getFlowPresentation(type, user) {
    const first = firstNameFromUser(user);
    const normalized = String(type || 'signup').toLowerCase();

    if (normalized === 'recovery') {
      return {
        loadingKey: 'loadingRecovery',
        title: first ? t('welcomeName', { name: first }) : t('welcome'),
        body: t('passwordUpdated'),
        buttonKey: 'openAppSignIn',
        fireworks: false,
        redirectToReset: true,
      };
    }

    if (normalized === 'magiclink') {
      return {
        loadingKey: 'loadingMagic',
        title: t('welcomeBack'),
        body: t('verifiedMagic'),
        buttonKey: 'openApp',
        fireworks: false,
      };
    }

    if (normalized === 'invite') {
      return {
        loadingKey: 'loading',
        title: first ? t('welcomeName', { name: first }) : t('welcome'),
        body: t('verifiedInvite'),
        buttonKey: 'openAppSignIn',
        fireworks: true,
      };
    }

    if (normalized === 'email_change') {
      return {
        loadingKey: 'loading',
        title: t('welcomeBack'),
        body: t('verifiedEmailChange'),
        buttonKey: 'openApp',
        fireworks: false,
      };
    }

    if (normalized === 'email') {
      return {
        loadingKey: 'loading',
        title: first ? t('welcomeName', { name: first }) : t('welcome'),
        body: t('verifiedEmail'),
        buttonKey: 'openAppSignIn',
        fireworks: true,
      };
    }

    return {
      loadingKey: 'loading',
      title: first ? t('welcomeName', { name: first }) : t('welcome'),
      body: t('verifiedSignup'),
      buttonKey: 'openAppSignIn',
      fireworks: true,
    };
  }

  function routeAuthIfNeeded(basePath) {
    if (!hasAuthPayload()) return false;

    const hash = parseHashParams();
    const type = hash.get('type') || '';
    const suffix = `${window.location.search}${window.location.hash}`;
    const pathname = window.location.pathname;

    if (hash.get('error') || hash.get('error_code') || parseSearchParams().get('error')) {
      if (!pathname.includes('error.html')) {
        window.location.replace(`${basePath}auth/error.html${suffix}`);
        return true;
      }
      return false;
    }

    if (type === 'recovery' && !pathname.includes('reset-password.html')) {
      window.location.replace(`${basePath}auth/reset-password.html${suffix}`);
      return true;
    }

    if (!pathname.includes('callback.html') && !pathname.includes('reset-password.html')) {
      window.location.replace(`${basePath}auth/callback.html${suffix}`);
      return true;
    }

    return false;
  }

  async function establishSession(client) {
    const hash = parseHashParams();
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return data.session;
    }

    const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(window.location.href);
    if (!exchangeError && data.session) {
      return data.session;
    }

    const { data: sessionData, error: getError } = await client.auth.getSession();
    if (getError || !sessionData.session) {
      throw exchangeError || getError || new Error('No session');
    }
    return sessionData.session;
  }

  function isPasswordValid(value) {
    return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
  }

  function eyeIconSvg(open) {
    if (open) {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-4.12 5.12M6.12 6.12A11.8 11.8 0 001 12c1.73 3.89 6 7 11 7 1.09 0 2.13-.15 3.09-.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>';
  }

  function wirePasswordToggle(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    if (!input || !button) return;

    let visible = false;
    const sync = () => {
      input.type = visible ? 'text' : 'password';
      button.innerHTML = eyeIconSvg(visible);
      button.setAttribute('aria-label', visible ? t('hidePassword') : t('showPassword'));
    };
    button.addEventListener('click', () => {
      visible = !visible;
      sync();
    });
    sync();
  }

  function renderPasswordStrengthHint(elementId, password) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!password) {
      element.textContent = '';
      element.className = 'field-hint hidden';
      return;
    }

    const strong = isPasswordValid(password);
    element.textContent = strong ? t('strong') : t('weak');
    element.className = `field-hint ${strong ? 'success' : 'error'}`;
  }

  function renderPasswordMatchHint(elementId, password, confirm) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!confirm) {
      element.textContent = '';
      element.className = 'field-hint hidden';
      return;
    }

    const matches = password === confirm;
    element.textContent = matches ? t('passwordsMatch') : t('mismatch');
    element.className = `field-hint ${matches ? 'success' : 'error'}`;
  }

  function startFireworks(canvas) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    let raf = 0;
    let running = true;
    const particles = [];
    const colors = ['#ef5d8f', '#d05e8a', '#f7c948', '#9fd3ff', '#ffffff'];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function burst(x, y) {
      for (let i = 0; i < 36; i += 1) {
        const angle = (Math.PI * 2 * i) / 36;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 50 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2,
        });
      }
    }

    burst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    setTimeout(() => burst(window.innerWidth * 0.35, window.innerHeight * 0.28), 180);
    setTimeout(() => burst(window.innerWidth * 0.65, window.innerHeight * 0.32), 320);

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.life -= 1;
        ctx.globalAlpha = Math.max(0, p.life / 80);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (particles.length > 0) {
        raf = requestAnimationFrame(frame);
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }

  window.AuthPages = {
    lang,
    t,
    createClient,
    parseHashParams,
    parseSearchParams,
    firstNameFromUser,
    buildDeepLink,
    buildAppDeepLinkWithoutSession,
    getAuthType,
    hasAuthPayload,
    getFlowPresentation,
    routeAuthIfNeeded,
    establishSession,
    startFireworks,
    isPasswordValid,
    wirePasswordToggle,
    renderPasswordStrengthHint,
    renderPasswordMatchHint,
    languageToggleLabel,
    toggleLang,
    mountLanguageToggle,
    syncDocumentLanguage,
  };
})();
