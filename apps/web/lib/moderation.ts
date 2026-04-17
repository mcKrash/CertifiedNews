/**
 * Content Moderation Engine
 * Enforces strict community guidelines similar to major social media platforms
 * Detects and blocks hate speech, racism, harassment, and prohibited content
 */

// Comprehensive list of prohibited terms and patterns
const PROHIBITED_PATTERNS = {
  // Hate speech and racist slurs
  raceSlurs: [
    /\b(n[i1]gg[a3]|n[i1]gg[a3]h|cracker|chink|gook|spic|wetback|beaner|towelhead|raghead|camel jockey|sand n[i1]gg[a3])\b/gi,
    /\b(k[i1]ke|hymie|sheenie|yid)\b/gi,
    /\b(paki|paki bashing|paki bash)\b/gi,
  ],
  
  // Religious discrimination
  religiousHate: [
    /\b(allahu akbar.*kill|death to|destroy.*religion|religion of peace.*sarcasm)\b/gi,
    /\b(jewish conspiracy|zionist conspiracy|reptilians)\b/gi,
  ],
  
  // Gender and sexual orientation discrimination
  genderHate: [
    /\b(tr[a4]nny|tr[a4]ns.*freak|f[a4]ggot|f[a4]g|dyke|lesbo)\b/gi,
    /\b(kill all.*|exterminate.*|gas.*)\b/gi,
  ],
  
  // Harassment and threats
  harassment: [
    /\b(i will kill you|i'm going to kill|kys|kill yourself|go kill yourself|neck yourself)\b/gi,
    /\b(i know where you live|doxx|swat you|find your address)\b/gi,
    /\b(rape|sexual assault|molest).*you\b/gi,
  ],
  
  // Violent extremism
  violence: [
    /\b(bomb|bombing|shooting|massacre|terrorism|terrorist attack).*\b(plan|execute|commit)\b/gi,
    /\b(join isis|join al-qaeda|join.*extremist)\b/gi,
  ],
  
  // Spam and commercial content
  spam: [
    /\b(click here|buy now|limited offer|act now|free money|earn money fast)\b/gi,
    /https?:\/\/[^\s]+\.(bit\.ly|tinyurl|short\.link)/gi,
  ],
};

// User violation tracking
interface UserViolation {
  userId: string;
  violationCount: number;
  lastViolation: Date;
  bannedUntil?: Date;
  isBanned: boolean;
}

const userViolations = new Map<string, UserViolation>();

/**
 * Check if content violates community guidelines
 * @param content The text content to check
 * @returns Object with violation status and details
 */
export function checkContentViolation(content: string): {
  isViolating: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
} {
  const lowerContent = content.toLowerCase();

  // Check each category
  for (const [category, patterns] of Object.entries(PROHIBITED_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        let severity: 'low' | 'medium' | 'high' = 'medium';
        
        if (category === 'raceSlurs' || category === 'genderHate' || category === 'religiousHate') {
          severity = 'high';
        } else if (category === 'harassment' || category === 'violence') {
          severity = 'high';
        } else if (category === 'spam') {
          severity = 'low';
        }

        return {
          isViolating: true,
          reason: getCategoryReason(category),
          severity,
        };
      }
    }
  }

  // Check for excessive caps (spam-like behavior)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    return {
      isViolating: true,
      reason: 'Excessive capitalization detected. Please use normal text formatting.',
      severity: 'low',
    };
  }

  // Check for excessive repetition
  const words = content.split(/\s+/);
  const wordFrequency = new Map<string, number>();
  for (const word of words) {
    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
  }
  
  for (const [word, count] of wordFrequency) {
    if (count > words.length * 0.3 && word.length > 3) {
      return {
        isViolating: true,
        reason: 'Excessive repetition detected. Please vary your message.',
        severity: 'low',
      };
    }
  }

  return {
    isViolating: false,
    severity: 'low',
  };
}

/**
 * Get human-readable reason for violation category
 */
function getCategoryReason(category: string): string {
  const reasons: Record<string, string> = {
    raceSlurs: 'Your comment contains racist language. This violates our Community Guidelines.',
    religiousHate: 'Your comment contains hate speech targeting a religion. This is not allowed.',
    genderHate: 'Your comment contains hate speech targeting gender or sexual orientation. This violates our policies.',
    harassment: 'Your comment contains harassment or threats. This is strictly prohibited.',
    violence: 'Your comment contains content promoting violence or extremism. This is not permitted.',
    spam: 'Your comment appears to be spam or commercial content. Please keep discussions relevant.',
  };
  
  return reasons[category] || 'Your comment violates our Community Guidelines.';
}

/**
 * Track user violations and determine if they should be banned
 */
export function recordViolation(userId: string, severity: 'low' | 'medium' | 'high'): {
  shouldBan: boolean;
  banDuration?: number;
  warningLevel: number;
} {
  let violation = userViolations.get(userId);
  
  if (!violation) {
    violation = {
      userId,
      violationCount: 0,
      lastViolation: new Date(),
      isBanned: false,
    };
  }

  // Reset violations if last violation was more than 30 days ago
  const daysSinceLastViolation = (new Date().getTime() - violation.lastViolation.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastViolation > 30) {
    violation.violationCount = 0;
  }

  // Increment violation count based on severity
  const severityWeight = {
    low: 1,
    medium: 2,
    high: 3,
  };
  
  violation.violationCount += severityWeight[severity];
  violation.lastViolation = new Date();

  // Determine ban status
  let shouldBan = false;
  let banDuration = 0;

  if (violation.violationCount >= 10) {
    // Permanent ban
    shouldBan = true;
    violation.isBanned = true;
    banDuration = Infinity;
  } else if (violation.violationCount >= 7) {
    // 30-day ban
    shouldBan = true;
    violation.bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    banDuration = 30;
  } else if (violation.violationCount >= 4) {
    // 7-day ban
    shouldBan = true;
    violation.bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    banDuration = 7;
  }

  userViolations.set(userId, violation);

  return {
    shouldBan,
    banDuration: banDuration === Infinity ? undefined : banDuration,
    warningLevel: Math.min(Math.floor(violation.violationCount / 2), 5),
  };
}

/**
 * Check if a user is currently banned
 */
export function isUserBanned(userId: string): {
  isBanned: boolean;
  reason?: string;
  unbanDate?: Date;
} {
  const violation = userViolations.get(userId);
  
  if (!violation) {
    return { isBanned: false };
  }

  if (violation.isBanned) {
    return {
      isBanned: true,
      reason: 'You have been permanently banned from commenting due to repeated violations of our Community Guidelines.',
    };
  }

  if (violation.bannedUntil && new Date() < violation.bannedUntil) {
    return {
      isBanned: true,
      reason: `You are temporarily banned from commenting until ${violation.bannedUntil.toLocaleDateString()}.`,
      unbanDate: violation.bannedUntil,
    };
  }

  // Clear expired ban
  if (violation.bannedUntil && new Date() >= violation.bannedUntil) {
    violation.bannedUntil = undefined;
    userViolations.set(userId, violation);
  }

  return { isBanned: false };
}

/**
 * Get user violation history
 */
export function getUserViolationStatus(userId: string): {
  violationCount: number;
  warningLevel: number;
  isBanned: boolean;
} {
  const violation = userViolations.get(userId);
  
  if (!violation) {
    return {
      violationCount: 0,
      warningLevel: 0,
      isBanned: false,
    };
  }

  return {
    violationCount: violation.violationCount,
    warningLevel: Math.min(Math.floor(violation.violationCount / 2), 5),
    isBanned: violation.isBanned || (violation.bannedUntil ? new Date() < violation.bannedUntil : false),
  };
}

/**
 * Community Guidelines text
 */
export const COMMUNITY_GUIDELINES = `
## Community Guidelines

We are committed to fostering a safe, respectful, and inclusive community. All comments must comply with the following guidelines:

### ✓ What's Allowed
- Respectful discussion and debate
- Sharing diverse viewpoints and opinions
- Constructive criticism and feedback
- Links to relevant sources and articles

### ✗ What's Not Allowed
1. **Hate Speech & Discrimination**: Comments containing slurs, racist, sexist, homophobic, or transphobic language
2. **Harassment & Threats**: Personal attacks, threats, doxxing, or calls for violence
3. **Misinformation**: Deliberately spreading false information or conspiracy theories
4. **Spam**: Commercial promotions, excessive links, or repetitive content
5. **Violent Extremism**: Content promoting terrorism or violent ideologies
6. **Sexual Content**: Explicit sexual material or harassment of a sexual nature

### Enforcement
- **First Violation**: Warning (visible only to you)
- **2-3 Violations**: 24-hour comment suspension
- **4-6 Violations**: 7-day ban from commenting
- **7+ Violations**: 30-day ban from commenting
- **10+ Violations**: Permanent ban from the platform

### Appeals
If you believe your comment was removed in error, please contact our moderation team at support@certifiednews.com

Thank you for helping us maintain a respectful community!
`;
