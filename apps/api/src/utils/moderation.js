// Moderation utility - ported from frontend for server-side validation

const HATE_SPEECH_PATTERNS = [
  /\b(hate|kill|attack)\s+(all\s+)?(muslims?|jews?|christians?|hindus?|buddhists?|atheists?|women|men|gay|lesbian|trans|lgbtq|black|white|asian|latino|immigrant|refugee)\b/gi,
  /\b(n-word|f-word|slur)\b/gi,
  /\b(inferior|subhuman|vermin|plague)\b/gi,
];

const HARASSMENT_PATTERNS = [
  /\b(kys|kill yourself|i hope you die|go die|you deserve to die)\b/gi,
  /\b(doxx|doxing|doxxed|address|phone number|ssn)\b/gi,
  /\b(rape|assault|abuse|molest)\s+(you|her|him|them)\b/gi,
];

const VIOLENT_EXTREMISM_PATTERNS = [
  /\b(bomb|bombing|terrorist|terrorism|jihad|attack|massacre|genocide)\b/gi,
  /\b(white supremacy|white power|aryan|nazi|kkk|isis|al-qaeda)\b/gi,
  /\b(overthrow|revolution|armed uprising|civil war)\b/gi,
];

const SPAM_PATTERNS = [
  /^(.{1,3})\1{5,}$/g, // Repeated characters
  /\b(click here|buy now|limited time|free money|work from home|earn cash)\b/gi,
  /https?:\/\/[^\s]+/g, // URLs
];

const VIOLATION_HISTORY = new Map();

/**
 * Check content for violations
 */
function checkContentViolation(content) {
  if (!content || content.trim().length === 0) {
    return {
      isViolating: false,
      severity: 'none',
      reason: null,
    };
  }

  // Check hate speech
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isViolating: true,
        severity: 'high',
        reason: 'Your comment contains hate speech or discriminatory language.',
      };
    }
  }

  // Check harassment
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isViolating: true,
        severity: 'high',
        reason: 'Your comment contains harassment or threats.',
      };
    }
  }

  // Check violent extremism
  for (const pattern of VIOLENT_EXTREMISM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isViolating: true,
        severity: 'critical',
        reason: 'Your comment promotes violence or extremism.',
      };
    }
  }

  // Check spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isViolating: true,
        severity: 'medium',
        reason: 'Your comment appears to be spam.',
      };
    }
  }

  return {
    isViolating: false,
    severity: 'none',
    reason: null,
  };
}

/**
 * Record violation for a user
 */
function recordViolation(userId, severity = 'medium') {
  const history = VIOLATION_HISTORY.get(userId) || {
    violations: [],
    warnings: 0,
    suspensions: [],
  };

  history.violations.push({
    timestamp: new Date(),
    severity,
  });

  // Determine enforcement action
  const recentViolations = history.violations.filter(
    v => new Date() - v.timestamp < 30 * 24 * 60 * 60 * 1000 // 30 days
  );

  let shouldBan = false;
  let banDuration = null;
  let reason = null;

  if (recentViolations.length >= 3) {
    // 3+ violations in 30 days = 7-day ban
    shouldBan = true;
    banDuration = 7;
    reason = 'Temporary ban due to multiple violations. You can comment again in 7 days.';
  } else if (recentViolations.length >= 5) {
    // 5+ violations = 30-day ban
    shouldBan = true;
    banDuration = 30;
    reason = 'Extended ban due to repeated violations. You can comment again in 30 days.';
  } else if (recentViolations.some(v => v.severity === 'critical')) {
    // Any critical violation = permanent ban
    shouldBan = true;
    banDuration = null;
    reason = 'Permanent ban due to severe violation of Community Guidelines.';
  }

  VIOLATION_HISTORY.set(userId, history);

  return {
    shouldBan,
    banDuration,
    reason,
  };
}

/**
 * Check if user is banned
 */
function isUserBanned(userId) {
  const history = VIOLATION_HISTORY.get(userId);

  if (!history || !history.suspensions || history.suspensions.length === 0) {
    return {
      isBanned: false,
      reason: null,
      unbanDate: null,
    };
  }

  const latestSuspension = history.suspensions[history.suspensions.length - 1];

  if (!latestSuspension.expiresAt) {
    // Permanent ban
    return {
      isBanned: true,
      reason: latestSuspension.reason,
      unbanDate: null,
    };
  }

  if (new Date() < new Date(latestSuspension.expiresAt)) {
    // Temporary ban still active
    return {
      isBanned: true,
      reason: latestSuspension.reason,
      unbanDate: new Date(latestSuspension.expiresAt),
    };
  }

  // Ban has expired
  return {
    isBanned: false,
    reason: null,
    unbanDate: null,
  };
}

/**
 * Ban user
 */
function banUser(userId, duration = null, reason = 'Violation of Community Guidelines') {
  const history = VIOLATION_HISTORY.get(userId) || {
    violations: [],
    warnings: 0,
    suspensions: [],
  };

  const suspension = {
    timestamp: new Date(),
    reason,
    expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
  };

  history.suspensions.push(suspension);
  VIOLATION_HISTORY.set(userId, history);

  return suspension;
}

module.exports = {
  checkContentViolation,
  recordViolation,
  isUserBanned,
  banUser,
};
