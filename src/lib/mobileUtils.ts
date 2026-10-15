export function triggerHaptic(
  type: "light" | "medium" | "success" | "error" = "light"
): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "success":
        navigator.vibrate([15, 50, 20]);
        break;
      case "error":
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignora se non supportato
  }
}