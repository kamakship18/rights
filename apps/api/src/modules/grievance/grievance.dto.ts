/**
 * Grievance DTOs — re-exported from @repo/shared for end-to-end typing.
 *
 * All Zod schemas and TypeScript types live in packages/shared so both
 * the API and the web frontend share identical validation and types.
 */
export {
  IntentDtoSchema,
  CreateGrievanceDtoSchema,
  type IntentDto,
  type CreateGrievanceDto,
  type IntentPreview,
} from '@repo/shared';
