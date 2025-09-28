// Ouvre une vraie popup (top-level). Retourne la fenêtre ou null si bloquée.
export function openCenteredPopup(url: string, w = 560, h = 650): Window | null {
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const height = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;

  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;

  const win = window.open(
    url,
    'google-oauth',
    `scrollbars=yes,resizable=yes,width=${w},height=${h},top=${top},left=${left}`
  );
  return win ?? null;
}
