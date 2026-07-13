import { normalizeEmailAddress } from "./emailTypes.js";

export function buildContactEmailIndex(contacts) {
  const byEmail = new Map();
  const byName = new Map();

  contacts.forEach((contact) => {
    if (contact.email) {
      byEmail.set(normalizeEmailAddress(contact.email), contact);
    }

    const nameKey = String(contact.name || "")
      .trim()
      .toLowerCase();
    if (nameKey) {
      byName.set(nameKey, contact);
    }
  });

  return { byEmail, byName };
}

export function matchMessageToContact(message, index) {
  const candidates = [
    ...(message.from || []),
    ...(message.to || []),
    ...(message.cc || []),
  ].map((email) => normalizeEmailAddress(email));

  for (const email of candidates) {
    const direct = index.byEmail.get(email);
    if (direct) return { contact: direct, confidence: "high" };
  }

  const subject = String(message.subject || "").toLowerCase();
  for (const [name, contact] of index.byName.entries()) {
    if (name && subject.includes(name)) {
      return { contact, confidence: "low" };
    }
  }

  return null;
}
