import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type DragOffset = { x: number; y: number };

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function usePanelDrag() {
  const [offset, setOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const sessionRef = useRef<DragSession | null>(null);

  const endDrag = useCallback((target: HTMLElement, pointerId: number) => {
    if (sessionRef.current?.pointerId === pointerId) {
      sessionRef.current = null;
    }
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [offset.x, offset.y]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    setOffset({
      x: session.originX + (event.clientX - session.startX),
      y: session.originY + (event.clientY - session.startY),
    });
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    endDrag(event.currentTarget, event.pointerId);
  }, [endDrag]);

  const handlePointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    endDrag(event.currentTarget, event.pointerId);
  }, [endDrag]);

  return {
    offset,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
