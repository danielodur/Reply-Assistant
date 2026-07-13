import { createContext, useContext, type ReactNode } from 'react';

/**
 * The set of "next step" targets a NextStepRing can attach to.
 * Keep this list short: one ring at a time, only on truly primary actions.
 */
export type NextStepId =
  | 'pick-contact'
  | 'generate'
  | 'copy';

type NextStepContextValue = {
  activeStep: NextStepId | null;
};

const NextStepContext = createContext<NextStepContextValue>({ activeStep: null });

type NextStepProviderProps = {
  activeStep: NextStepId | null;
  children: ReactNode;
};

export function NextStepProvider({ activeStep, children }: NextStepProviderProps) {
  return (
    <NextStepContext.Provider value={{ activeStep }}>
      {children}
    </NextStepContext.Provider>
  );
}

/**
 * Returns the ring pulse class when this step is the single active step,
 * otherwise empty string. Append to an existing className list.
 */
export function useNextStepClass(step: NextStepId): string {
  const { activeStep } = useContext(NextStepContext);
  return activeStep === step ? 'next-step-ring-pulse' : '';
}

/**
 * Pure read of whether a step is active — for consumers that want to
 * branch behavior, not just append a class.
 */
export function useIsNextStepActive(step: NextStepId): boolean {
  const { activeStep } = useContext(NextStepContext);
  return activeStep === step;
}
