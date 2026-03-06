/**
 * Play a short notification sound using Web Audio API.
 * Used when a new message is received from customer or AI.
 */
export function playNotificationSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore errors (e.g. autoplay policy)
  }
}

/**
 * Play a 3-tone ascending alert sound when a customer requests a human agent.
 * More distinctive than the regular notification sound (C5 → E5 → G5 arpeggio).
 */
export function playTransferRequestSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();

    // Three ascending tones: C5 (523Hz) → E5 (659Hz) → G5 (784Hz)
    const tones = [523, 659, 784];
    const noteLen = 0.12; // seconds per note
    const gap = 0.04;     // gap between notes

    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = ctx.currentTime + i * (noteLen + gap);
      const end = start + noteLen;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, end);

      osc.start(start);
      osc.stop(end);
    });
  } catch {
    // Ignore errors (e.g. autoplay policy)
  }
}
