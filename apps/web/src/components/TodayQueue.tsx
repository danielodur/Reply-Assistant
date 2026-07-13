import { useEffect, useRef, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import { interpolate, type AppTranslations } from '../i18n/translations';
import type { BusinessContext } from '../config/businessContext';
import type { RecipientProfile, WorkMode } from './workbench/types';

export type TodayQueueAction =
  | {
      kind: 'open-screen';
      screenId: 'messages' | 'business-context' | 'snippet-library';
    }
  | {
      kind: 'seed-input';
      input: string;
      workMode: WorkMode;
      recipient: RecipientProfile;
      textType: string;
    };

export type QueueTask = {
  id: string;
  title: string;
  body: string;
  estMinutes: number;
  action: TodayQueueAction;
  meta?: { riskLevel: 'low' | 'medium' | 'high'; followUpTiming: string };
};

type QueueTaskWithScore = QueueTask & {
  score: number;
};

type BuildTodayQueueTasksInput = {
  copy: AppTranslations;
  unreadMessageCount: number;
  snippetCount: number;
  recentRepliesCount: number;
  context: BusinessContext;
};

export function buildTodayQueueTasks({
  copy,
  unreadMessageCount,
  snippetCount,
  recentRepliesCount,
  context,
}: BuildTodayQueueTasksInput): QueueTask[] {
  const openScreenAction = (
    screenId: 'messages' | 'business-context' | 'snippet-library',
  ): TodayQueueAction => ({
    kind: 'open-screen',
    screenId,
  });

  const seedInputAction = (input: string, recipient: RecipientProfile, textType: string): TodayQueueAction => ({
    kind: 'seed-input',
    input,
    workMode: 'reply',
    recipient,
    textType,
  });

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
  const computeScore = (impact: number, urgency: number, friction: number) => {
    const normalizedImpact = clamp01(impact);
    const normalizedUrgency = clamp01(urgency);
    const normalizedFriction = clamp01(friction);
    // Weighted ranking: prioritize impact first, then urgency, then ease-of-execution.
    return normalizedImpact * 0.5 + normalizedUrgency * 0.35 + (1 - normalizedFriction) * 0.15;
  };

  const queueCopy = copy.todayQueue;
  const filledContextFields = Object.values(context).filter(value => value.trim().length > 0).length;
  const missingContextFields = Math.max(0, 8 - filledContextFields);
  const snippetDeficit = Math.max(0, 5 - snippetCount);

  const tasks: QueueTaskWithScore[] = [
    ...(unreadMessageCount > 0
      ? [
          {
            id: 'clear-unread',
            title: queueCopy.clearUnreadTitle,
            body: interpolate(queueCopy.clearUnreadBody, { count: unreadMessageCount }),
            estMinutes: 4,
            action: openScreenAction('messages'),
            score: computeScore(
              0.92,
              0.45 + unreadMessageCount * 0.08,
              0.35,
            ),
          },
        ]
      : []),
    ...(recentRepliesCount > 0
      ? [
          {
            id: 'follow-up-thread',
            title: queueCopy.followUpTitle,
            body: queueCopy.followUpBody,
            estMinutes: 3,
            action: seedInputAction(queueCopy.followUpPrompt, 'existing-client', 'follow-up'),
            score: computeScore(
              0.8,
              0.45 + recentRepliesCount * 0.06,
              0.25,
            ),
          },
        ]
      : [
          {
            id: 'warm-up-reply',
            title: queueCopy.warmupTitle,
            body: queueCopy.warmupBody,
            estMinutes: 2,
            action: seedInputAction(queueCopy.warmupPrompt, 'new-lead', 'shorter-reply'),
            score: computeScore(0.68, 0.62, 0.12),
          },
        ]),
    ...(filledContextFields < 4
      ? [
          {
            id: 'enrich-context',
            title: queueCopy.enrichContextTitle,
            body: interpolate(queueCopy.enrichContextBody, { count: filledContextFields, total: 8 }),
            estMinutes: 5,
            action: openScreenAction('business-context'),
            score: computeScore(
              0.55 + missingContextFields * 0.08,
              0.38 + missingContextFields * 0.07,
              0.5,
            ),
          },
        ]
      : []),
    ...(snippetCount < 5
      ? [
          {
            id: 'build-snippets',
            title: queueCopy.buildSnippetsTitle,
            body: interpolate(queueCopy.buildSnippetsBody, { count: snippetCount }),
            estMinutes: 4,
            action: openScreenAction('snippet-library'),
            score: computeScore(
              0.5 + snippetDeficit * 0.08,
              0.35 + snippetDeficit * 0.06,
              0.42,
            ),
          },
        ]
      : []),
  ];

  return tasks
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.estMinutes !== b.estMinutes) {
        return a.estMinutes - b.estMinutes;
      }
      return a.title.localeCompare(b.title);
    })
    .map(({ score: _score, ...task }) => task);
}

type TodayQueueProps = {
  onClose: () => void;
  copy: AppTranslations;
  unreadMessageCount: number;
  snippetCount: number;
  recentRepliesCount: number;
  context: BusinessContext;
  extraTasks?: QueueTask[];
  onRunTask: (action: TodayQueueAction) => void | Promise<void>;
  isDone: (taskId: string) => boolean;
  analytics: {
    done: number;
    usedNow: number;
  };
  markDone: (taskId: string, estMinutes: number) => void;
  markUsedNow: (taskId: string, estMinutes: number) => void;
};

export default function TodayQueue({
  onClose,
  copy,
  unreadMessageCount,
  snippetCount,
  recentRepliesCount,
  context,
  extraTasks = [],
  onRunTask,
  isDone,
  analytics,
  markDone,
  markUsedNow,
}: TodayQueueProps) {
  const pulseTimerRef = useRef<number | null>(null);
  const [showQueueCompletePulse, setShowQueueCompletePulse] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const queueCopy = copy.todayQueue;
  const tasks = buildTodayQueueTasks({
    copy,
    unreadMessageCount,
    snippetCount,
    recentRepliesCount,
    context,
  });

  const allTasks = [...extraTasks, ...tasks];
  const visibleTasks = allTasks.filter(task => !isDone(task.id));

  const triggerQueueCompletePulse = () => {
    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current);
    }

    setShowQueueCompletePulse(true);
    pulseTimerRef.current = window.setTimeout(() => {
      setShowQueueCompletePulse(false);
      pulseTimerRef.current = null;
    }, 1300);
  };

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  return (
    <MiniScreenFrame
      label={queueCopy.frameLabel}
      title={queueCopy.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
    >
      <div className="clean-scrollbar h-full overflow-y-auto px-5 pt-5 pb-7">
        <div className="mb-3 rounded-[12px] border border-[#f1d7e1] bg-[#fff6fa] px-3 py-2 text-[10px] text-[#9e5b77]">
          {queueCopy.intro}
        </div>

        <div className="mb-3 rounded-[11px] border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500">
          {interpolate(queueCopy.dailyImpactSummary, {
            done: analytics.done,
            usedNow: analytics.usedNow,
          })}
        </div>

        {showQueueCompletePulse && (
          <div className="mb-3 animate-pulse rounded-[12px] border border-[#f1d7e1] bg-[linear-gradient(180deg,#fff8fb,#fff3f8)] px-3 py-2 text-center">
            <p className="text-[11px] font-semibold tracking-[0.02em] text-[#b14f77]">{queueCopy.celebrateTitle}</p>
            <p className="mt-0.5 text-[10px] text-[#9f5f7b]">{queueCopy.celebrateBody}</p>
          </div>
        )}

        {visibleTasks.length === 0 ? (
          (analytics.done + analytics.usedNow) > 0 ? (
            <div className="animate-fade-in rounded-[20px] bg-[linear-gradient(135deg,#fce7f2_0%,#fff0f7_60%,#fdf4ff_100%)] px-5 py-8 text-center shadow-[0_2px_16px_rgba(232,92,139,0.10)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E85C8B,#c94f7a)] shadow-[0_6px_18px_rgba(232,92,139,0.30)]">
                <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M4 10l4.5 4.5L16 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-[#b94474]">{queueCopy.celebrateTitle}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#c36090]">
                {queueCopy.celebrateBody}
              </p>
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
              <p className="text-[13px] font-semibold text-slate-800">{queueCopy.emptyTitle}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{queueCopy.emptyBody}</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {visibleTasks.map(task => {
              const isFocused = focusedTaskId === task.id;
              return (
              <article
                key={task.id}
                onMouseEnter={() => setFocusedTaskId(task.id)}
                onMouseLeave={() => setFocusedTaskId(null)}
                className={[
                  'rounded-[16px] border bg-white px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200',
                  isFocused
                    ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#bc557d]">{queueCopy.taskLabel}</p>
                  {task.meta && (
                    <span className={[
                      'rounded-full border px-1.5 py-0.5 text-[9px] font-semibold',
                      task.meta.riskLevel === 'high' ? 'border-red-100 bg-red-50 text-red-600' :
                      task.meta.riskLevel === 'medium' ? 'border-amber-100 bg-amber-50 text-amber-600' :
                      'border-emerald-100 bg-emerald-50 text-emerald-600',
                    ].join(' ')}>
                      {task.meta.riskLevel === 'high' ? 'High risk' : task.meta.riskLevel === 'medium' ? 'Medium risk' : 'Low risk'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-900">{task.title}</p>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-600">{task.body}</p>
                {task.meta?.followUpTiming && (
                  <p className="mt-1 text-[10px] text-slate-400">{task.meta.followUpTiming}</p>
                )}

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {interpolate(queueCopy.estMinutes, { minutes: task.estMinutes })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="cursor-pointer rounded-full border border-[#f0dbe3] bg-[#fff5f9] px-2.5 py-1 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2] hover:text-[#c15480] active:bg-[#fde9f2]"
                      onClick={() => {
                        const willCompleteQueue = visibleTasks.length === 1;
                        markDone(task.id, task.estMinutes);
                        if (willCompleteQueue) {
                          triggerQueueCompletePulse();
                        }
                      }}
                    >
                      {queueCopy.markDone}
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer rounded-full bg-[#E85C8B] px-3 py-1 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.2)] transition hover:bg-[#d94f81] active:scale-[0.97]"
                      onClick={async () => {
                        const willCompleteQueue = visibleTasks.length === 1;
                        markUsedNow(task.id, task.estMinutes);
                        if (willCompleteQueue) {
                          triggerQueueCompletePulse();
                        }
                        await onRunTask(task.action);
                      }}
                    >
                      {queueCopy.useNow}
                    </button>
                  </div>
                </div>
              </article>
            );
            })}  
          </div>
        )}
      </div>
    </MiniScreenFrame>
  );
}
