import { useEffect, useState, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { Alert } from '../types';

interface UseAlertHubResult {
  connection: HubConnection | null;
  connected: boolean;
}

export const useAlertHub = (
  onReceiveAlert: (alert: Alert) => void
): UseAlertHubResult => {
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const callbackRef = useRef(onReceiveAlert);

  useEffect(() => {
    callbackRef.current = onReceiveAlert;
  }, [onReceiveAlert]);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/alert')
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveAlert', (alert: Alert) => {
      callbackRef.current(alert);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        setConnected(true);
      } catch (err) {
        console.error('SignalR connection failed:', err);
        setConnected(false);
      }
    };

    connection.onreconnected(() => {
      setConnected(true);
    });

    connection.onreconnecting(() => {
      setConnected(false);
    });

    connection.onclose(() => {
      setConnected(false);
    });

    startConnection();

    return () => {
      connection.stop();
      connectionRef.current = null;
      setConnected(false);
    };
  }, []);

  return {
    connection: connectionRef.current,
    connected,
  };
};
