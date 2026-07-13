import { useState, useEffect } from 'react';
import type { QueueTask } from '../components/TodayQueue';
import { domainIncludesQueues, onDataReset } from '../config/resetAppData';

const STORAGE_KEY_PREFIX = 'replyAssistantInsightTasks_';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadInsightTasks(): QueueTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + getTodayKey());
    if (!raw) return [];
    return JSON.parse(raw) as QueueTask[];
  } catch {
    return [];
  }
}

function saveInsightTasks(tasks: QueueTask[]): void {
  localStorage.setItem(STORAGE_KEY_PREFIX + getTodayKey(), JSON.stringify(tasks));
}

export function useInsightTasks() {
  const [insightTasks, setInsightTasks] = useState<QueueTask[]>(loadInsightTasks);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesQueues(domains)) {
        setInsightTasks(loadInsightTasks());
      }
    });
  }, []);

  const addInsightTask = (task: QueueTask) => {
    setInsightTasks(prev => {
      const next = [task, ...prev];
      saveInsightTasks(next);
      return next;
    });
  };

  return { insightTasks, addInsightTask };
}
