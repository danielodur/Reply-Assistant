function cleanLower(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function detectIntent(request) {
  const text = cleanLower(request?.rawInput);

  if (/\b(price|pricing|discount|budget|cost|expensive|quote)\b/.test(text)) {
    return "pricing_objection";
  }
  if (
    /\b(delay|late|extension|postpone|timeline|deadline|next week|next month)\b/.test(
      text,
    )
  ) {
    return "timeline_slip";
  }
  if (
    /\bangry|upset|frustrated|complain|escalate|manager|urgent issue|problem\b/.test(
      text,
    )
  ) {
    return "escalation_risk";
  }
  if (/\brenew|renewal|contract|churn|cancel|termination\b/.test(text)) {
    return "renewal_risk";
  }
  if (/\bfollow up|follow-up|checking in|any update|ping\b/.test(text)) {
    return "follow_up";
  }

  return "general_reply";
}

export function intentLabel(intent) {
  const labels = {
    pricing_objection: "Pricing objection",
    timeline_slip: "Timeline / deadline pressure",
    escalation_risk: "Escalation risk",
    renewal_risk: "Renewal risk",
    follow_up: "Follow-up needed",
    general_reply: "General business reply",
  };

  return labels[intent] || labels.general_reply;
}

export function assessRiskLevel(intent) {
  if (intent === "escalation_risk" || intent === "renewal_risk") return "high";
  if (intent === "pricing_objection" || intent === "timeline_slip")
    return "medium";
  return "low";
}

function getGenerationSource(request) {
  return String(request?.generationContext?.source || "composer")
    .trim()
    .toLowerCase();
}

export function suggestNextAction(intent, request) {
  const source = getGenerationSource(request);

  if (source === "today-queue") {
    return "Send this now, then mark the queue item complete so the worklist stays clean.";
  }

  if (source === "action-inbox") {
    return "Use this draft to clear the inbox item, then either send it or delegate it immediately so it does not return later.";
  }

  if (intent === "pricing_objection") {
    return "Anchor value first, then propose two scoped options with clear outcomes.";
  }
  if (intent === "timeline_slip") {
    return "Offer a revised date and one checkpoint so expectations stay aligned.";
  }
  if (intent === "escalation_risk") {
    return "Acknowledge concerns explicitly and suggest a fast escalation call window.";
  }
  if (intent === "renewal_risk") {
    return "Reconfirm goals and propose a short renewal review with measurable wins.";
  }
  if (intent === "follow_up") {
    return "Use a concise follow-up with one specific ask and one clear next step.";
  }
  return "Keep it concise and include one clear call-to-action.";
}

export function suggestFollowUp(intent, riskLevel) {
  if (riskLevel === "high") return "Follow up within 12-24 hours";
  if (intent === "pricing_objection" || intent === "timeline_slip")
    return "Follow up within 24-48 hours";
  return "Follow up within 2-3 business days";
}

export function suggestSubjectLine(request, intent) {
  const mode = String(request?.mode || "reply")
    .trim()
    .toLowerCase();
  const textType = String(request?.textType || "")
    .trim()
    .toLowerCase();
  const input = String(request?.rawInput || "").trim();
  const sourceTitle = String(request?.generationContext?.title || "").trim();

  if (mode === "internal") {
    if (sourceTitle) {
      return `Internal: ${sourceTitle}`;
    }
    return "Internal follow-up";
  }

  if (intent === "pricing_objection") {
    return "Options and next steps";
  }

  if (intent === "timeline_slip") {
    return "Revised timeline and next step";
  }

  if (intent === "renewal_risk") {
    return "Renewal review and next steps";
  }

  if (intent === "follow_up" || textType === "follow-up") {
    return "Quick follow-up";
  }

  if (sourceTitle) {
    return sourceTitle;
  }

  const cleanedInput = input
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();

  if (!cleanedInput) {
    return "Next steps";
  }

  return cleanedInput.slice(0, 58);
}

function ensureCtaLine(message, line) {
  const normalized = String(message || "").trim();
  if (!normalized) return line;
  if (
    /\?$/.test(normalized) ||
    /\b(next step|confirm|schedule|availability)\b/i.test(normalized)
  ) {
    return normalized;
  }
  return `${normalized}\n\n${line}`;
}

function safeVariant(baseMessage) {
  return String(baseMessage || "").trim();
}

function assertiveVariant(baseMessage, intent) {
  const ctaByIntent = {
    pricing_objection:
      "Would you like me to send two options today so you can choose the best fit?",
    timeline_slip:
      "Can we confirm the revised deadline today so both sides can plan accordingly?",
    escalation_risk:
      "Can we schedule a 15-minute call today to resolve this quickly?",
    renewal_risk:
      "Can we lock a short renewal review this week to align on next steps?",
    follow_up: "Could you confirm by end of day if you'd like to proceed?",
    general_reply:
      "Could you confirm the next step so we can move this forward today?",
  };

  return ensureCtaLine(
    baseMessage,
    ctaByIntent[intent] || ctaByIntent.general_reply,
  );
}

function strategicVariant(baseMessage, request, intent) {
  const ctx = request?.businessContext || {};
  const product = String(ctx.productsServices || "").trim();
  const company = String(ctx.companyName || "").trim();

  const valueLine = product
    ? `This should help you move faster with ${product}.`
    : company
      ? `This should help you move faster with ${company}.`
      : "This should help you move faster with a clear next step.";

  const strategyCtaByIntent = {
    pricing_objection:
      "If useful, I can share an ROI-focused option and a budget-friendly option side by side.",
    timeline_slip:
      "If useful, I can share a milestone-based plan so delivery stays predictable.",
    escalation_risk:
      "If useful, I can loop in the right owner and close this with a concrete resolution plan.",
    renewal_risk:
      "If useful, I can map the next 30 days with measurable milestones before renewal.",
    follow_up:
      "If useful, I can send a concise recap and proposed next step for quick approval.",
    general_reply:
      "If useful, I can provide a concise next-step plan you can approve quickly.",
  };

  const cta = strategyCtaByIntent[intent] || strategyCtaByIntent.general_reply;
  return ensureCtaLine(baseMessage, `${valueLine} ${cta}`);
}

export function buildVariants(baseMessage, request) {
  const intent = detectIntent(request);

  return [
    {
      id: "safe",
      title: "Safe",
      message: safeVariant(baseMessage),
      rationale: "Minimizes friction while staying professional and clear.",
    },
    {
      id: "assertive",
      title: "Assertive",
      message: assertiveVariant(baseMessage, intent),
      rationale: "Adds a direct call-to-action to speed decisions.",
    },
    {
      id: "strategic",
      title: "Strategic",
      message: strategicVariant(baseMessage, request, intent),
      rationale: "Frames business value and drives a concrete next step.",
    },
  ];
}

export function buildInsight(request) {
  const intent = detectIntent(request);
  const riskLevel = assessRiskLevel(intent);

  return {
    intent,
    intentLabel: intentLabel(intent),
    riskLevel,
    nextAction: suggestNextAction(intent, request),
    followUp: suggestFollowUp(intent, riskLevel),
    subjectLine: suggestSubjectLine(request, intent),
  };
}
