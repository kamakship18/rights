/** Shared TypeScript types for the Grievance Chain feature. */

export interface GrievanceFile {
  name:     string;
  url:      string;
  hash:     string;   // SHA256
  mimetype?: string;
  size?:    number;
}

export interface GrievanceMetadata {
  fullName?:          string | null;
  pin:                string;
  location?:          string | null;
  title:              string;
  description:        string;
  tags:               string[];
  rightsRegulations:  string[];
}

export type StorageType = 'blockchain' | 'mongodb';

export interface GrievanceChainRecord {
  grievanceId:     string;
  metadata:        GrievanceMetadata;
  files:           GrievanceFile[];
  blockchainHash:  string | null;
  blockIndex:      number | null;
  storageType:     StorageType;
  isAnonymous:     boolean;
  timestamp:       string;
  blockchainBlock?: BlockInfo | null;
  chainValid?:     boolean | null;
}

export interface BlockInfo {
  index:        number;
  timestamp:    string;
  hash:         string;
  previousHash: string;
  data:         Record<string, unknown>;
}

export interface ChainStatus {
  blocks:        number;
  grievances:    number;
  valid:         boolean;
  invalidReason: string | null;
  latestHash:    string | null;
  latestIndex:   number | null;
}

export interface CreateGrievancePayload {
  fullName?:         string;
  pin:               string;
  location?:         string;
  title:             string;
  description:       string;
  tags:              string[];
  rightsRegulations: string[];
  files?:            File[];
}

export interface CreateGrievanceResult {
  success:        boolean;
  grievanceId:    string;
  storageType:    StorageType;
  blockchainHash: string | null;
  blockIndex:     number | null;
  timestamp:      string;
  filesProcessed: number;
}

export interface ListResponse {
  success:  boolean;
  items:    GrievanceChainRecord[];
  total:    number;
  page:     number;
  limit:    number;
  hasNext:  boolean;
}
