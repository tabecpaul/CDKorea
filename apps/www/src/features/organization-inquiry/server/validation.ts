const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^01[016789]\d{7,8}$/;
export const organizationTypes = ["church", "christian_university", "university", "organization", "other"] as const;
export const programOptions = ["lecture", "workshop", "group_assessment", "consulting"] as const;
const limited = (value: unknown, max: number) => typeof value === "string" && value.trim().length <= max ? value.trim() : "";

export function parseOrganizationInquiry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_request");
  const body = value as Record<string, unknown>;
  const organizationName = limited(body.organizationName, 160);
  const contactName = limited(body.contactName, 60);
  const email = limited(body.email, 256).toLowerCase();
  const phone = limited(body.phone, 32).replace(/\D/g, "");
  const organizationType = organizationTypes.includes(body.organizationType as never) ? body.organizationType as typeof organizationTypes[number] : null;
  const rawPrograms = Array.isArray(body.programInterests) ? body.programInterests : [];
  const programInterests = [...new Set(rawPrograms.filter((item): item is typeof programOptions[number] => programOptions.includes(item as never)))];
  const participants = Number(body.estimatedParticipants);
  if (!organizationName || !contactName || !EMAIL.test(email) || !PHONE.test(phone) || !organizationType || programInterests.length === 0 || body.privacyAgreed !== true) throw new Error("required_fields_invalid");
  return { organizationName, organizationType, contactName, email, phone, programInterests, estimatedParticipants: Number.isInteger(participants) && participants > 0 && participants <= 10000 ? participants : null, message: limited(body.message, 1000) || null, privacyAgreed: true, utmSource: limited(body.utmSource, 128) || null, utmMedium: limited(body.utmMedium, 128) || null, utmCampaign: limited(body.utmCampaign, 128) || null, utmContent: limited(body.utmContent, 128) || null };
}
