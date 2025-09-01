let initialized = false;

export function initAudio(manifestAudio) {
  if (initialized) return;
  initialized = true;
  console.log('Audio initialized', manifestAudio);
}
