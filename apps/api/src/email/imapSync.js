import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { normalizeEmailAddress, parseAddressList } from "./emailTypes.js";

function bodyToString(source) {
  if (!source) return "";
  if (typeof source === "string") return source;
  if (Buffer.isBuffer(source)) return source.toString("utf8");
  return "";
}

export async function fetchImapMessages(syncConfig) {
  let emittedError = null;
  const client = new ImapFlow({
    host: syncConfig.host,
    port: syncConfig.port,
    secure: syncConfig.secure,
    auth: {
      user: syncConfig.username,
      pass: syncConfig.password,
    },
    // Prevent the connection from hanging indefinitely.
    // connectionTimeout: time to establish the TCP+TLS handshake (10 s).
    // greetingTimeout:   time to receive the IMAP server greeting (5 s).
    // socketTimeout:     max idle time mid-session (30 s).
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 30000,
    logger: false,
  });

  // ImapFlow emits connection/socket errors as EventEmitter errors.
  // Without a listener, Node treats them as unhandled and terminates the API.
  client.on("error", (error) => {
    emittedError = error;
  });

  const collected = [];

  try {
    await client.connect();
    await client.mailboxOpen(syncConfig.mailbox || "INBOX");

    const since = new Date(Date.now() - syncConfig.sinceDays * 86400000);
    const messageIds = await client.search({ since });
    const selected = messageIds.slice(-syncConfig.maxMessages);

    for await (const message of client.fetch(selected, {
      uid: true,
      envelope: true,
      source: true,
      internalDate: true,
    })) {
      const raw = bodyToString(message.source);
      const parsed = await simpleParser(raw);

      const from = parseAddressList(message.envelope?.from);
      const to = parseAddressList(message.envelope?.to);
      const cc = parseAddressList(message.envelope?.cc);
      const senderMatches = from.some(
        (value) => value === normalizeEmailAddress(syncConfig.username),
      );

      collected.push({
        id: String(message.uid),
        threadId: String(message.envelope?.inReplyTo || message.uid),
        subject: String(
          message.envelope?.subject || parsed.subject || "",
        ).trim(),
        text: String(parsed.text || parsed.html || "").trim(),
        from,
        to,
        cc,
        sentAt: (message.internalDate || new Date()).toISOString(),
        direction: senderMatches ? "outbound" : "inbound",
      });
    }

    return collected;
  } catch (error) {
    throw emittedError || error;
  } finally {
    if (client.usable) {
      await client.logout();
    }
  }
}
