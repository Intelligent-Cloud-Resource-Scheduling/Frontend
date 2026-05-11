import { useEffect, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3500";

export function useProcessStatus(
  processUuids: string[],
  onStatusUpdate: (processUuid: string, status: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (processUuids.length === 0) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to all active processes
      processUuids.forEach((uuid) => {
        ws.send(JSON.stringify({ action: "subscribe", process_uuid: uuid }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "status_update" && data.process_uuid && data.status) {
          onStatusUpdate(data.process_uuid, data.status);
        }
      } catch {}
    };

    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, [JSON.stringify(processUuids)]); // reconnect only when the list changes
}