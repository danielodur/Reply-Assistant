import type { AppTranslations } from '../../i18n/translations';
import type { MiniScreenId } from '../workbench/types';
import { menuItemIcon } from './MoreFeaturesMenuIcon';
import { primaryMenuItems, secondaryMenuItems, type MenuItemId } from './menuConfig';

type MoreFeaturesMenuProps = {
  copy: AppTranslations;
  hoveredMenuId: MenuItemId | null;
  unreadMessageCount: number;
  pendingTodayQueueCount: number;
  actionInboxCount: number;
  onHover: (id: MenuItemId | null) => void;
  onOpenScreen: (screenId: MiniScreenId) => void;
};

export default function MoreFeaturesMenu({
  copy,
  hoveredMenuId,
  unreadMessageCount,
  pendingTodayQueueCount,
  actionInboxCount,
  onHover,
  onOpenScreen,
}: MoreFeaturesMenuProps) {
  const renderItem = (item: { id: MiniScreenId }) => {
    const menuId = item.id as MenuItemId;
    return (
      <button
        key={item.id}
        type="button"
        className={[
          'flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2.5 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60',
          item.id === 'reset-data' ? 'text-[#e85c8b]' : '',
          hoveredMenuId === item.id
            ? 'bg-white/24 shadow-[0_6px_14px_rgba(15,23,42,0.08)]'
            : 'hover:bg-white/18',
        ].join(' ')}
        onMouseEnter={() => onHover(menuId)}
        onMouseMove={() => onHover(menuId)}
        onFocus={() => onHover(menuId)}
        onBlur={() => onHover(null)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onOpenScreen(item.id)}
      >
        <span className="flex h-4 w-4 items-center justify-center text-[#8f8a8d]">
          <span className={item.id === 'reset-data' ? 'text-[#e85c8b]' : undefined}>
            {menuItemIcon(item.id)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <span
            className={[
              'whitespace-nowrap text-[12px] leading-5',
              item.id === 'reset-data' ? 'font-semibold text-[#e85c8b]' : 'text-[#231f20]',
            ].join(' ')}
          >
            {copy.moreFeatures.menuLabels[item.id]}
          </span>
          {renderBadge(item.id)}
        </span>
      </button>
    );
  };

  const renderBadge = (id: MiniScreenId) => {
    const value = id === 'today-queue'
      ? pendingTodayQueueCount
      : id === 'action-inbox'
        ? actionInboxCount
        : id === 'messages'
          ? unreadMessageCount
          : 0;
    if (value <= 0) return null;
    return (
      <span
        className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#e85c8b] px-1.5 text-[10px] font-semibold text-white shadow-[0_6px_14px_rgba(232,92,139,0.28)]"
        aria-label={`${value} pending`}
      >
        {value > 99 ? '99+' : value}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5d5255]">
          {copy.moreFeatures.workMenuTitle}
        </p>
        <div className="space-y-1.5">{primaryMenuItems.map(renderItem)}</div>
      </div>
      <details className="group">
        <summary className="cursor-pointer rounded-[12px] px-2.5 py-2 text-[11px] font-semibold text-[#3f3738] transition hover:bg-white/18">
          {copy.moreFeatures.secondaryMenuTitle}
        </summary>
        <div className="mt-1 space-y-1.5">{secondaryMenuItems.map(renderItem)}</div>
      </details>
    </div>
  );
}
