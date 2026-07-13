import React, { useMemo } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import type { AppTranslations } from '../i18n/translations';
import { computeStreak } from './workbench/activity';
import type { ContactThread } from '../config/contactThreads';
import { buildContactPriority } from './contacts/contactPriority';
import NoAppDataGuide from './guidance/NoAppDataGuide';
import type { MiniScreenId } from './workbench/types';

const DAILY_KEY_PREFIX = 'replyAssistantDaily_';
const QUEUE_KEY_PREFIX = 'replyAssistantTodayQueue_';
const MINUTES_PER_REPLY = 2;

function loadQueueMinutesSaved(dateKeys: string[]): number[] {
  return dateKeys.map(key => {
    const raw = localStorage.getItem(QUEUE_KEY_PREFIX + key);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw) as { analytics?: { minutesSaved?: number } };
      return parsed?.analytics?.minutesSaved ?? 0;
    } catch {
      return 0;
    }
  });
}

function getLastNDaysKeys(n: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < n; i++) {
    keys.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return keys;
}

function loadDayCounts(dateKeys: string[]): number[] {
  return dateKeys.map(key => {
    const raw = localStorage.getItem(DAILY_KEY_PREFIX + key);
    return raw ? (Number.parseInt(raw, 10) || 0) : 0;
  });
}

type Props = {
  onClose: () => void;
  copy: AppTranslations;
  recentRepliesRecipients: string[];
  contacts: ContactThread[];
  foundationEmpty?: boolean;
  onOpenScreen?: (screenId: MiniScreenId) => void;
};

export default function WeeklyRecap({
  onClose,
  copy,
  recentRepliesRecipients,
  contacts,
  foundationEmpty = false,
  onOpenScreen,
}: Props) {
  const c = copy.weeklyRecap;

  const { dateKeys, counts, totalThisWeek, streak, timeSaved, topRecipient, minutesSavedByDay, needsReplyCount, followUpsDueCount } = useMemo(() => {
    const keys = getLastNDaysKeys(7);
    const dayCounts = loadDayCounts(keys);
    const total = dayCounts.reduce((a, b) => a + b, 0);
    const currentStreak = computeStreak();
    const queueMinutes = loadQueueMinutesSaved(keys);
    const fallbackMinutes = dayCounts.map(count => count * MINUTES_PER_REPLY);
    const finalMinutesByDay = queueMinutes.some(minutes => minutes > 0) ? queueMinutes : fallbackMinutes;
    const saved = finalMinutesByDay.reduce((sum, minutes) => sum + minutes, 0);

    const recipientFreq: Record<string, number> = {};
    for (const r of recentRepliesRecipients) {
      recipientFreq[r] = (recipientFreq[r] ?? 0) + 1;
    }
    const top = Object.entries(recipientFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const priorityRows = contacts.map(contact => buildContactPriority(contact));
    const needsReply = priorityRows.filter(priority => priority.status === 'needs-reply').length;
    const followUpsDue = priorityRows.filter(priority => priority.status === 'follow-up-today').length;

    return {
      dateKeys: keys,
      counts: dayCounts,
      totalThisWeek: total,
      streak: currentStreak,
      timeSaved: saved,
      topRecipient: top,
      minutesSavedByDay: finalMinutesByDay,
      needsReplyCount: needsReply,
      followUpsDueCount: followUpsDue,
    };
  }, [contacts, recentRepliesRecipients]);

  const maxCount = Math.max(...counts, 1);

  const dayLabels = c.days;
  const todayIndex = new Date().getDay();
  // Convert Sunday=0 to Mon=0 index
  const mondayFirst = (todayIndex + 6) % 7;

  return (
    <MiniScreenFrame label={c.frameLabel} title={c.frameTitle} onClose={onClose} backLabel={copy.miniScreen.back}>
      <p className="px-5 pt-1 text-[10px] leading-snug text-slate-500">{c.introLine}</p>
      {totalThisWeek === 0 && timeSaved === 0 ? (
        foundationEmpty && onOpenScreen ? (
          <NoAppDataGuide copy={copy} onOpenScreen={onOpenScreen} className="mx-5" />
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-10 pb-8 text-center">
            <span className="text-[36px]">📊</span>
            <p className="mt-3 text-[13px] font-semibold text-[#231f20]">{c.noDataTitle}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.noDataBody}</p>
          </div>
        )
      ) : (
        <div className="space-y-4 px-5 pt-4 pb-6">
          {/* Bar chart for 7 days */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#b85a82]">
              {c.thisWeek}
            </p>
            <div className="flex items-end gap-1.5 h-[52px]">
              {counts.map((count, index) => {
                const heightPct = (count / maxCount) * 100;
                const isToday = index === mondayFirst;
                return (
                  <div key={dateKeys[index]} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative w-full rounded-t-[4px] transition-all duration-500" style={{ height: '40px' }}>
                      <div
                        className={[
                          'absolute bottom-0 w-full rounded-t-[4px] transition-all duration-700',
                          isToday
                            ? 'bg-[linear-gradient(180deg,#f279a6,#dd5f91)]'
                            : 'bg-[#f4d7e1]',
                        ].join(' ')}
                        style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className={[
                      'text-[8px]',
                      isToday ? 'font-semibold text-[#b85a82]' : 'text-slate-400',
                    ].join(' ')}>
                      {dayLabels[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard emoji="✍️" label={c.repliesLabel} value={String(totalThisWeek)} />
            <StatCard emoji="🔥" label={c.streakLabel} value={String(streak)} />
            <StatCard emoji="⏱️" label={c.timeSavedLabel} value={`${timeSaved} ${c.timeSavedUnit}`} />
            <StatCard emoji="↩" label={c.needsReplyLabel} value={String(needsReplyCount)} />
            <StatCard emoji="•" label={c.followUpsDueLabel} value={String(followUpsDueCount)} />
            {topRecipient && (
              <StatCard
                emoji="👤"
                label={c.topRecipientLabel}
                value={copy.recipientLabels[topRecipient] ?? topRecipient}
              />
            )}
          </div>

          {/* 7-day queue minutes saved sparkline */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#b85a82]">
              {c.queueSparklineLabel}
            </p>
            <QueueSparkline values={minutesSavedByDay} dateKeys={dateKeys} dayLabels={dayLabels} mondayFirst={mondayFirst} />
          </div>
        </div>
      )}
    </MiniScreenFrame>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#f4d7e1] bg-[#fff7fa] px-3 py-2.5">
      <span className="text-[16px] leading-none">{emoji}</span>
      <p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className="text-[14px] font-semibold text-[#231f20]">{value}</p>
    </div>
  );
}

function QueueSparkline({
  values,
  dateKeys,
  dayLabels,
  mondayFirst,
}: {
  values: number[];
  dateKeys: string[];
  dayLabels: string[];
  mondayFirst: number;
}) {
  const W = 280;
  const H = 40;
  const pad = 4;
  const maxVal = Math.max(...values, 1);
  const stepX = (W - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - v / maxVal) * (H - pad * 2),
  }));

  const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="rounded-[12px] border border-[#f4d7e1] bg-[#fff7fa] px-3 py-2.5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        aria-hidden="true"
        overflow="visible"
      >
        {/* Area fill */}
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E85C8B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E85C8B" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${H - pad} ${polyline} ${pad + (values.length - 1) * stepX},${H - pad}`}
          fill="url(#sparkFill)"
        />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#E85C8B"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {points.map((p, i) => values[i] > 0 && (
          <circle
            key={dateKeys[i]}
            cx={p.x}
            cy={p.y}
            r={i === mondayFirst ? 3 : 2}
            fill={i === mondayFirst ? '#E85C8B' : '#fce7f2'}
            stroke="#E85C8B"
            strokeWidth="1.2"
          />
        ))}
      </svg>
      {/* Day labels */}
      <div className="mt-1 flex justify-between">
        {dayLabels.map((label, i) => (
          <span
            key={label}
            className={['text-[7px]', i === mondayFirst ? 'font-semibold text-[#b85a82]' : 'text-slate-400'].join(' ')}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
