const { Howl } = window;

// tiny 30ms beep generated via Node; replace with real assets as needed
const BEEP = 'data:audio/wav;base64,UklGRgQCAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YeABAAAAAFkrklElbrN9ZH4jcKBUGy8FBHXYkrH0kx2DC4H7jWeoLs3397MjN0vXafJ7Zn/Kc3xafDYKDC3gE7h5mB2FSYCPirei6MX37+obkUQdZbR553/7dv1fpj0EFAbo3L5mnZmHCICZh2ad3L4G6AQUpj39X/t253+0eR1lkUTqG/fv6MW3oo+KSYAdhXmYE7gt4AoMfDZ8WspzZn/ye9dpN0uzI/f3Ls1nqPuNC4Edg/STkrF12AUEGy+gVCNwZH6zfSVuklFZKwAAp9RurtuRTYKcgd2PYKvl0Pv7iyduTgxs43z1fgVymVfSMgkITdzJtCmWDoSagDaMhKWEyfbz0x/tR4dn43q3f3F1SV0YOgkQFuRvu+OaTIYZgAWJA6Bawvzr+hckQZpiZ3j4f2d4mmIkQfoX/OtawgOgBYkZgEyG45pvuxbkCRAYOkldcXW3f+N6h2ftR9Mf9vOEyYSlNoyagA6EKZbJtE3cCQjSMplXBXL1fuN8DGxuTosn+/vl0GCr3Y+cgU2C25FurqfUAABZK5JRJW6zfWR+I3CgVBsvBQR12JKx9JMdgwuB+41nqC7N9/ezIzdL12nye2Z/ynN8Wnw2Cgwt4BO4eZgdhUmAj4q3oujF9+/qG5FEHWU=';

export function initAudio() {
  const ambient = new Howl({ src: [BEEP], loop: true, volume: 0.4 });
  const sfx = new Howl({ src: [BEEP], volume: 0.5 });

  const unlock = () => {
    ambient.play();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });

  return { ambient, sfx };
}
