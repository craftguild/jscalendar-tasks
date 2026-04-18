/**
 * Returns whether public demo behavior is enabled for the running app.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === "true";
}
