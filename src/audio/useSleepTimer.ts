import { useCallback, useMemo, useRef, useState } from "react";
import type { SleepTimerValue } from "./types";

export function useSleepTimer() {
  const [sleepTimer, setSleepTimerState] = useState<SleepTimerValue>(null);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const expiringRef = useRef(false);

  const setSleepTimer = useCallback((value: SleepTimerValue) => {
    expiringRef.current = false;
    setSleepTimerState(value);
    setSleepEndsAt(typeof value === "number" ? Date.now() + value : null);
  }, []);

  const clearSleepTimer = useCallback(() => {
    expiringRef.current = false;
    setSleepTimerState(null);
    setSleepEndsAt(null);
  }, []);

  const shouldSleepNow = useCallback(() => {
    if (expiringRef.current || sleepEndsAt === null || Date.now() < sleepEndsAt) {
      return false;
    }

    expiringRef.current = true;
    setSleepTimerState(null);
    setSleepEndsAt(null);
    return true;
  }, [sleepEndsAt]);

  const finishExpiring = useCallback(() => {
    expiringRef.current = false;
  }, []);

  const consumeTrackEndStop = useCallback(() => {
    if (sleepTimer !== "track-end") {
      return false;
    }

    clearSleepTimer();
    return true;
  }, [clearSleepTimer, sleepTimer]);

  const sleepLabel = useMemo(() => {
    if (sleepTimer === "track-end") {
      return "After this track";
    }

    if (sleepEndsAt === null) {
      return "Off";
    }

    const minutesLeft = Math.max(
      1,
      Math.ceil((sleepEndsAt - Date.now()) / 60_000)
    );

    return `${minutesLeft} min left`;
  }, [sleepEndsAt, sleepTimer]);

  return {
    clearSleepTimer,
    consumeTrackEndStop,
    finishExpiring,
    setSleepTimer,
    shouldSleepNow,
    sleepEndsAt,
    sleepLabel,
    sleepTimer,
  };
}
