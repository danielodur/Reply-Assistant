export type ImapPresetId = 'qq' | '163' | '126' | 'sina' | 'sohu' | 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'aol' | 'zoho';

export type ImapPreset = {
  id: ImapPresetId;
  label: string;
  host: string;
  port: number;
  secure: boolean;
};

export const IMAP_PRESETS: ImapPreset[] = [
  { id: 'qq', label: 'QQ Mail', host: 'imap.qq.com', port: 993, secure: true },
  { id: '163', label: '163 Mail', host: 'imap.163.com', port: 993, secure: true },
  { id: '126', label: '126 Mail', host: 'imap.126.com', port: 993, secure: true },
  { id: 'sina', label: 'Sina Mail', host: 'imap.sina.com', port: 993, secure: true },
  { id: 'sohu', label: 'Sohu Mail', host: 'imap.sohu.com', port: 993, secure: true },
  { id: 'gmail', label: 'Gmail', host: 'imap.gmail.com', port: 993, secure: true },
  { id: 'outlook', label: 'Outlook / Hotmail', host: 'outlook.office365.com', port: 993, secure: true },
  { id: 'yahoo', label: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993, secure: true },
  { id: 'icloud', label: 'iCloud Mail', host: 'imap.mail.me.com', port: 993, secure: true },
  { id: 'aol', label: 'AOL Mail', host: 'imap.aol.com', port: 993, secure: true },
  { id: 'zoho', label: 'Zoho Mail', host: 'imap.zoho.com', port: 993, secure: true },
];
