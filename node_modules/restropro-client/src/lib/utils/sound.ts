// Simple notification sound using Web Audio API
// This creates a pleasant notification beep without needing audio files

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playNotificationSound = (type: 'order' | 'kot' | 'alert' = 'order') => {
  try {
    const ctx = getAudioContext();
    
    // Create oscillator for the tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure based on notification type
    if (type === 'order') {
      // Two-tone notification for new orders
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.1); // C#6
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'kot') {
      // Single tone for KOT
      oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
      
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } else {
      // Alert sound - three quick beeps
      oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Audio not supported or blocked
    console.log('Audio notification not available');
  }
};

// Test sound
export const testNotificationSound = () => {
  playNotificationSound('order');
  setTimeout(() => playNotificationSound('kot'), 400);
  setTimeout(() => playNotificationSound('alert'), 800);
};