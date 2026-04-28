export type PerformanceTier = 'excellent' | 'good' | 'average' | 'below_average' | 'poor';

export interface OfficerPerformance {
  id:              string;
  name:            string;
  designation:     string;
  department:      string;
  jurisdictionPin: string;
  totalCases:      number;
  resolvedCases:   number;
  pendingCases:    number;
  activeCases:     number;
  successRate:     number;
  rating:          number;
  ratingLabel:     string;
  tier:            PerformanceTier;
}

export interface LocalityPerformance {
  pin:           string;
  totalCases:    number;
  resolvedCases: number;
  pendingCases:  number;
  activeCases:   number;
  successRate:   number;
  rating:        number;
  ratingLabel:   string;
  tier:          PerformanceTier;
  officerCount:  number;
  topOfficer?:   { name: string; designation: string; successRate: number } | null;
}

export interface PerformanceSummary {
  totalOfficers:      number;
  totalGrievances:    number;
  totalResolved:      number;
  totalPending:       number;
  overallSuccessRate: number;
}

export interface PerformanceReport {
  summary:          PerformanceSummary;
  officers:         OfficerPerformance[];
  localities:       LocalityPerformance[];
  topOfficers:      OfficerPerformance[];
  bottomOfficers:   OfficerPerformance[];
  topLocalities:    LocalityPerformance[];
  bottomLocalities: LocalityPerformance[];
}
