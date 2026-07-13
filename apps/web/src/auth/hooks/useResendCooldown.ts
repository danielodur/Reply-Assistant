import { useCallback, useEffect, useState } from 'react';
import { formatCountdown, RESEND_COOLDOWN_SECONDS } from '../passwordRules';

export function useResendCooldown(initialSeconds = RESEND_COOLDOWN_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const restart = useCallback(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    countdownLabel: formatCountdown(secondsLeft),
    restart,
  };
}
