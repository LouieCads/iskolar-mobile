import { isDeadlinePassed } from "../utils/scholarship";

export interface ScholarshipSponsorDTO {
  sponsor_id: string;
  organization_name: string;
  profile_url?: string | null;
}

/**
 * Minimal shape returned in list endpoints (discover, sponsor list).
 * Omits description and custom_form_fields to keep payloads small.
 */
export interface ScholarshipPreviewDTO {
  scholarship_id: string;
  sponsor_id: string;
  status: string;
  is_open_for_applications: boolean;
  type: string | null;
  purpose: string | null;
  title: string;
  total_amount: number;
  total_slot: number;
  application_deadline: Date | null;
  criteria: string[];
  required_documents: string[];
  image_url: string | null;
  custom_form_fields: any[] | null;
  created_at: Date;
  updated_at: Date;
  sponsor: ScholarshipSponsorDTO;
}

/**
 * Full shape returned by the detail endpoint and sponsor management list.
 * Extends preview with description and application count.
 */
export interface ScholarshipDetailDTO extends ScholarshipPreviewDTO {
  description: string | null;
  applications_count: number;
}

export function buildScholarshipPreview(data: any): ScholarshipPreviewDTO {
  return {
    scholarship_id: data.scholarship_id,
    sponsor_id: data.sponsor_id,
    status: data.status,
    is_open_for_applications:
      data.status === "active" && !isDeadlinePassed(data.application_deadline),
    type: data.type ?? null,
    purpose: data.purpose ?? null,
    title: data.title,
    total_amount: data.total_amount,
    total_slot: data.total_slot,
    application_deadline: data.application_deadline ?? null,
    criteria: data.criteria,
    required_documents: data.required_documents,
    image_url: data.image_url ?? null,
    custom_form_fields: data.custom_form_fields ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    sponsor: {
      sponsor_id: data.sponsor?.sponsor_id,
      organization_name: data.sponsor?.organization_name,
      profile_url: data.sponsor?.user?.profile_url ?? data.sponsor?.profile_url ?? null,
    },
  };
}

export function buildScholarshipDetail(
  data: any,
  applicationsCount?: number
): ScholarshipDetailDTO {
  return {
    ...buildScholarshipPreview(data),
    description: data.description ?? null,
    applications_count:
      applicationsCount !== undefined
        ? applicationsCount
        : parseInt(data.applications_count) || 0,
  };
}
