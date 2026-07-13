import type { MiniScreenId } from '../workbench/types';

export const menuSections: Array<{ items: Array<{ id: MiniScreenId }> }> = [
  {
    items: [
      { id: 'contact-threads' },
      { id: 'business-context' },
      { id: 'action-inbox' },
      { id: 'recent-replies' },
      { id: 'snippet-library' },
      { id: 'settings' },
    ],
  },
  {
    items: [
      { id: 'today-queue' },
      { id: 'messages' },
      { id: 'weekly-recap' },
      { id: 'customer-service' },
      { id: 'refer-friends' },
      { id: 'reset-data' },
    ],
  },
];

export const allMenuItems = menuSections.flatMap(section => section.items);
export const primaryMenuItems = menuSections[0].items;
export const secondaryMenuItems = menuSections[1].items;
export type MenuItemId = typeof allMenuItems[number]['id'];
