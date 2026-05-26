import { z } from "zod";

/**
 * Shared content-rights acknowledgement schema used by upload, generation,
 * render, and publish flows. The user must confirm each applicable item
 * before the server function will proceed.
 */
export const RightsAckSchema = z.object({
  ownsRights: z.literal(true, {
    message: "You must confirm you own or have permission to use this content.",
  }),
  musicLicensed: z.boolean().default(false),
  noCelebrityLikeness: z.boolean().default(false),
  noFakeEndorsement: z.boolean().default(false),
  noMisleadingClaims: z.boolean().default(false),
  humanReviewed: z.boolean().default(false),
  notes: z.string().max(500).default(""),
});

export type RightsAck = z.infer<typeof RightsAckSchema>;

/**
 * Strict acknowledgement for publishing AI-generated videos.
 * All safety boxes must be checked AND the human-review warning acknowledged.
 */
export const PublishAckSchema = RightsAckSchema.extend({
  musicLicensed: z.literal(true),
  noCelebrityLikeness: z.literal(true),
  noFakeEndorsement: z.literal(true),
  noMisleadingClaims: z.literal(true),
  humanReviewed: z.literal(true),
});

export type PublishAck = z.infer<typeof PublishAckSchema>;

export const AuditAction = z.enum([
  "upload",
  "generate",
  "render",
  "export",
  "publish",
  "safety_block",
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditResourceType = z.enum([
  "image",
  "video",
  "audio",
  "music",
  "logo",
  "voice",
  "render",
  "post",
  "ai_generation",
]);
export type AuditResourceType = z.infer<typeof AuditResourceType>;
