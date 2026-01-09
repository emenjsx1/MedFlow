import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TakeoverAlertSettings {
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
}

export function useTakeoverAlerts(settings: TakeoverAlertSettings = { soundEnabled: true, browserNotificationEnabled: true }) {
  const { tenantId, user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPermissionRef = useRef(false);

  // Request browser notification permission
  useEffect(() => {
    if (settings.browserNotificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        hasPermissionRef.current = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          hasPermissionRef.current = permission === 'granted';
        });
      }
    }
  }, [settings.browserNotificationEnabled]);

  // Create audio element for notification sound
  useEffect(() => {
    if (settings.soundEnabled) {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playBeep = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };

      // Store the playBeep function for later use
      (window as unknown as { playTakeoverAlert: () => void }).playTakeoverAlert = playBeep;
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, message: string, patientName?: string) => {
    // Play sound
    if (settings.soundEnabled && (window as unknown as { playTakeoverAlert?: () => void }).playTakeoverAlert) {
      (window as unknown as { playTakeoverAlert: () => void }).playTakeoverAlert();
    }

    // Show toast
    toast({
      title,
      description: message,
      duration: 10000, // 10 seconds for important alerts
    });

    // Browser notification
    if (settings.browserNotificationEnabled && hasPermissionRef.current) {
      new Notification(title, {
        body: message,
        icon: '/faviconazul.png',
        tag: 'takeover-alert',
        requireInteraction: true,
      });
    }
  }, [settings.soundEnabled, settings.browserNotificationEnabled]);

  // Subscribe to new messages in paused conversations
  useEffect(() => {
    if (!tenantId || !user) return;

    // Subscribe to user_notifications table for real-time alerts
    const channel = supabase
      .channel('takeover-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const notification = payload.new as {
            type: string;
            title: string;
            message: string;
            user_id: string | null;
            data: { patient_name?: string };
          };
          
          // Check if notification is for this user or broadcast
          if (notification.user_id && notification.user_id !== user.id) return;
          
          // Only show takeover-related notifications
          if (notification.type === 'takeover_message') {
            showNotification(
              notification.title,
              notification.message || '',
              notification.data?.patient_name
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, user, showNotification]);

  return { showNotification };
}
