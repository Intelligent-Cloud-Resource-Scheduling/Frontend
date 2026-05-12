import { useEffect, useMemo, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3500";

export function useProcessStatus(
  processUuids: string[],
  onStatusUpdate: (processUuid: string, status: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const processKey = useMemo(() => processUuids.join("|"), [processUuids]);
  const processList = useMemo(() => (processKey ? processKey.split("|") : []), [processKey]);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  useEffect(() => {
    if (processList.length === 0) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to all active processes
      processList.forEach((uuid) => {
        ws.send(JSON.stringify({ action: "subscribe", process_uuid: uuid }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "status_update" && data.process_uuid && data.status) {
          onStatusUpdateRef.current(data.process_uuid, data.status);
        }
      } catch {}
    };

    return () => ws.close();
  }, [processList]); // reconnect only when the list changes
}
