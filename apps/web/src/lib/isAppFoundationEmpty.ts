import type { ContactThread } from '../config/contactThreads';

export function isAppFoundationEmpty(contactThreads: ContactThread[]): boolean {
  return contactThreads.length === 0;
}
