export const CONSENT_POLICY_VERSION = "2026-06-01";

const KEY = "agencyos.pending-consent";

export type PendingConsent = {
  policyVersion: string;
  source: "email_signup" | "google_oauth" | "manual_reaccept";
};

export function setPendingConsent(source: PendingConsent["source"]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ policyVersion: CONSENT_POLICY_VERSION, source }),
    );
  } catch {
    /* storage unavailable — consent is re-requested on next sign-in */
  }
}

export function consumePendingConsent(): PendingConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PendingConsent;
    if (!parsed?.policyVersion || !parsed?.source) return null;
    return parsed;
  } catch {
    return null;
  }
}
