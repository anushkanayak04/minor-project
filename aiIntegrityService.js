/**
 * AI Content Integrity & Anti-Promotion Engine
 *
 * Scope of what this engine can actually verify:
 *  1. Media metadata signatures written by known generative tools / C2PA manifests.
 *  2. Review-text patterns that indicate repetitive or extreme promotional language.
 *
 * It does NOT run a deepfake or forgery model. Any result is therefore reported
 * as "no marker detected" rather than "verified authentic".
 */

function detectAIAlteration(mediaStr) {
  if (!mediaStr || typeof mediaStr !== 'string') {
    return {
      isAltered: false,
      signatureFound: false,
      confidence: null,
      note: 'No media metadata was available to scan.'
    };
  }

  const str = mediaStr.toLowerCase();

  // Real, checkable signatures embedded by generative tools and C2PA manifests.
  const isSyntheticArtifact = str.includes('c2pa') ||
                              str.includes('stable-diffusion') ||
                              str.includes('midjourney') ||
                              str.includes('dall-e') ||
                              str.includes('generativeai') ||
                              (str.length > 50000 && str.includes('software') && str.includes('adobe photoshop cc 2026'));

  if (isSyntheticArtifact) {
    return {
      isAltered: true,
      signatureFound: true,
      confidence: 94,
      note: 'A generative-tool or C2PA content signature was found in the media metadata.'
    };
  }

  return {
    isAltered: false,
    signatureFound: false,
    confidence: null,
    note: 'No generative-tool signature found in the media metadata. This is a metadata check only and cannot confirm the media is unaltered.'
  };
}

function analyzePromotionBias(postData, userHistory) {
  const description = (postData.description || '').toLowerCase();
  const hotelName = (postData.hotel_name || '').toLowerCase();
  const foodPlace = (postData.food_place || '').toLowerCase();
  const hotelFeedback = (postData.hotel_feedback || '').toLowerCase();
  const foodFeedback = (postData.food_feedback || '').toLowerCase();

  // Extreme sentiment bias indicators
  const spamKeywords = ['best ever', '100% recommended', 'must visit guaranteed', '10/10 perfect', 'worst ever scam', 'don\'t ever go', 'horrible terrible'];
  let extremeKeywordCount = 0;
  spamKeywords.forEach(kw => {
    if (description.includes(kw) || hotelFeedback.includes(kw) || foodFeedback.includes(kw)) {
      extremeKeywordCount++;
    }
  });

  // Check user history for repetitive single-entity targeting
  let repetitiveTargetCount = 0;
  if (Array.isArray(userHistory) && userHistory.length > 0) {
    userHistory.forEach(pastPost => {
      const pastHotel = (pastPost.hotel_name || '').toLowerCase();
      const pastFood = (pastPost.food_place || '').toLowerCase();
      if ((hotelName && pastHotel === hotelName) || (foodPlace && pastFood === foodPlace)) {
        repetitiveTargetCount++;
      }
    });
  }

  // Determine promotion status
  if (repetitiveTargetCount >= 2 || extremeKeywordCount >= 3) {
    return {
      status: "Suspicious Review Pattern ⚠️",
      scoreDeduction: 25,
      reason: repetitiveTargetCount >= 2
        ? "Repetitive promotional posts targeting the same business entity"
        : "Extreme sentiment bias detected in review text"
    };
  }

  // Whole-word match only, so ordinary words like "adventure" are not flagged.
  const sponsoredPattern = /\b(sponsored|paid partnership|advertisement|advertising|collab(oration)?|promoted post)\b/;
  if (sponsoredPattern.test(description)) {
    return {
      status: "Sponsored / Commercial Post 📢",
      scoreDeduction: 5,
      reason: "Self-declared promotional or commercial content"
    };
  }

  return {
    status: "No Promotion Pattern Detected 🌿",
    scoreDeduction: 0,
    reason: "No repetitive or extreme promotional pattern found in this post"
  };
}

function analyzePostIntegrity(postData, userHistory, authorInfo) {
  const alterationCheck = detectAIAlteration(postData.media);
  const biasCheck = analyzePromotionBias(postData, userHistory);

  // The score reflects only the two checks actually performed above:
  // a metadata signature scan and a review-pattern analysis.
  let trustScore = alterationCheck.signatureFound ? 50 : 70;
  trustScore -= biasCheck.scoreDeduction;

  // Boost for Aadhaar-verified Pro Creators
  const isProCreator = authorInfo && (authorInfo.role === 'professional' || authorInfo.is_verified_pro);
  if (isProCreator) {
    trustScore = Math.min(99, trustScore + 10);
  }

  trustScore = Math.max(25, Math.min(99, trustScore));

  let badge = "No Synthetic Markers Detected 🛡️";
  let badgeColor = "emerald";

  if (alterationCheck.signatureFound) {
    badge = "Synthetic Media Signature Flagged 🚨";
    badgeColor = "red";
  } else if (trustScore < 60) {
    badge = "Suspicious Review Pattern ⚠️";
    badgeColor = "amber";
  }

  return {
    trustScore,
    isAiAltered: alterationCheck.isAltered,
    signatureFound: alterationCheck.signatureFound,
    alterationNote: alterationCheck.note,
    promotionStatus: biasCheck.status,
    promotionReason: biasCheck.reason,
    badge,
    badgeColor,
    isProAuthor: isProCreator
  };
}

module.exports = {
  detectAIAlteration,
  analyzePromotionBias,
  analyzePostIntegrity
};
