import type { MenuItemId } from './menuConfig';

export function menuItemIcon(id: string) {
  switch (id) {
    case 'today-queue':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 8.5h8M8 12h8M8 15.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m6.8 11.8 1 1 1.6-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'action-inbox':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 8.5h8M8 12h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'contact-threads':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <circle cx="8" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 18c.5-2.2 2.3-3.5 3.5-3.5s3 .8 3.5 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="13.5" y="6" width="6.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.5 9.5h2.5M15.5 12h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.5 12a7.5 7.5 0 0 0-.1-1.23l2.02-1.57l-1.9-3.29l-2.45.8a7.63 7.63 0 0 0-2.13-1.23L14.5 3h-5l-.44 2.48c-.76.27-1.47.69-2.13 1.23l-2.45-.8l-1.9 3.29l2.02 1.57c-.07.4-.1.81-.1 1.23s.03.83.1 1.23L2.58 14.8l1.9 3.29l2.45-.8c.66.54 1.37.96 2.13 1.23L9.5 21h5l.44-2.48c.76-.27 1.47-.69 2.13-1.23l2.45.8l1.9-3.29l-2.02-1.57c.07-.4.1-.81.1-1.23Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'customer-service':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M5 12a7 7 0 1 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3.5" y="12" width="3.5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="17" y="12" width="3.5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 20h2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'refer-friends':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <circle cx="8" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 18c.5-2.2 2.3-3.5 3.5-3.5s3 .8 3.5 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12.5 17.3c.5-2 2-2.8 3.5-2.8s3 .8 3.5 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m6.5 8.5l5.5 4l5.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'recent-replies':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5v5l3 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'snippet-library':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9h8M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'reset-data':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M9 4h6M10 11v5M14 11v5M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'business-context':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7.5 12h9M7.5 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'weekly-recap':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 16v-4M12 16v-7M16 16v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
