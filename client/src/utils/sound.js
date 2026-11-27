// Sound utility for playing SFX from /sfx/

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('wordshift_sound') !== 'false';
};

export const setSoundEnabled = (enabled) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wordshift_sound', enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('wordshift-sound-toggle', { detail: { enabled } }));
  }
};

export const playSound = (soundFileName) => {
  try {
    if (!isSoundEnabled()) return null;
    const audio = new Audio(`/sfx/${soundFileName}`);
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // Browser autoplay policy may suppress audio before first user gesture
      console.warn(`Audio playback prevented for ${soundFileName}:`, err);
    });
    return audio;
  } catch (err) {
    console.warn(`Audio initialization failed for ${soundFileName}:`, err);
    return null;
  }
};
