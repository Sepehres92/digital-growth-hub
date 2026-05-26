import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { RightsAck } from "@/lib/video-safety";

type Mode = "upload" | "generate" | "render" | "publish";

interface ContentRightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  /** Whether the content includes music (forces musicLicensed requirement). */
  includesMusic?: boolean;
  /** Whether the content is AI-generated and about to be published (forces human review). */
  requiresHumanReview?: boolean;
  onConfirm: (ack: RightsAck) => void | Promise<void>;
}

const TITLES: Record<Mode, string> = {
  upload: "Confirm content rights",
  generate: "Confirm content rights before generating",
  render: "Confirm content rights before rendering",
  publish: "Final review before publishing",
};

const DESCRIPTIONS: Record<Mode, string> = {
  upload:
    "By uploading, you confirm you own this content or have the rights to use it. Lovable does not check copyright on your behalf.",
  generate:
    "AI-generated video must comply with our content rules. Confirm the following before we send your request.",
  render:
    "You're about to render media into a finished video. Confirm the source material is yours to use.",
  publish:
    "AI-generated video must be reviewed by a human before publishing. Please confirm every item below.",
};

export function ContentRightsDialog({
  open,
  onOpenChange,
  mode,
  includesMusic = false,
  requiresHumanReview = mode === "publish",
  onConfirm,
}: ContentRightsDialogProps) {
  const [ownsRights, setOwnsRights] = useState(false);
  const [musicLicensed, setMusicLicensed] = useState(false);
  const [noCelebrity, setNoCelebrity] = useState(false);
  const [noFakeEndorse, setNoFakeEndorse] = useState(false);
  const [noMisleading, setNoMisleading] = useState(false);
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strict = mode === "publish";
  const canSubmit =
    ownsRights &&
    (!includesMusic || musicLicensed) &&
    (!strict || (noCelebrity && noFakeEndorse && noMisleading)) &&
    (!requiresHumanReview || humanReviewed);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm({
        ownsRights: true,
        musicLicensed,
        noCelebrityLikeness: noCelebrity,
        noFakeEndorsement: noFakeEndorse,
        noMisleadingClaims: noMisleading,
        humanReviewed,
        notes: notes.slice(0, 500),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {TITLES[mode]}
          </DialogTitle>
          <DialogDescription>{DESCRIPTIONS[mode]}</DialogDescription>
        </DialogHeader>

        {requiresHumanReview ? (
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Human review required</AlertTitle>
            <AlertDescription>
              AI-generated video can contain mistakes or unintended likenesses.
              Watch the full video and confirm it's safe to publish.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3 py-2">
          <Row
            checked={ownsRights}
            onChange={setOwnsRights}
            label="I own this content or have permission to use it."
          />
          {includesMusic ? (
            <Row
              checked={musicLicensed}
              onChange={setMusicLicensed}
              label="The background music is properly licensed for this use."
            />
          ) : null}
          <Row
            checked={noCelebrity}
            onChange={setNoCelebrity}
            label="No celebrity likeness or impersonation of a real person."
            required={strict}
          />
          <Row
            checked={noFakeEndorse}
            onChange={setNoFakeEndorse}
            label="No fake endorsements or fabricated testimonials."
            required={strict}
          />
          <Row
            checked={noMisleading}
            onChange={setNoMisleading}
            label="No misleading before/after claims or deceptive results."
            required={strict}
          />
          {requiresHumanReview ? (
            <Row
              checked={humanReviewed}
              onChange={setHumanReviewed}
              label="I have watched the full video and approve it for publishing."
              required
            />
          ) : null}

          {strict ? (
            <div className="pt-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Source of music, talent release info, etc."
                maxLength={500}
                className="mt-1"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : strict ? "Confirm and publish" : "Confirm and continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  checked,
  onChange,
  label,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="text-sm leading-snug">
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </span>
    </label>
  );
}
