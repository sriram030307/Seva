export type UserRole = 
  | 'CITIZEN'
  | 'OFFICER'
  | 'DEPARTMENT_ADMIN'
  | 'SUPERVISOR'
  | 'ADMIN'
  | 'ANALYST';

export type CivicCategory = 
  | 'ROAD'
  | 'WATER'
  | 'ELECTRICITY'
  | 'GARBAGE'
  | 'TRANSPORT'
  | 'HEALTHCARE'
  | 'POLICE'
  | 'DISASTER';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SentimentType = 
  | 'CALM'
  | 'NEUTRAL'
  | 'CONCERNED'
  | 'FRUSTRATED'
  | 'ANGRY'
  | 'URGENT';

export type EvidenceStatus = 
  | 'NOT_SUBMITTED'
  | 'CITIZEN_SUBMITTED'
  | 'WAITING_FOR_GOVERNMENT'
  | 'GOVERNMENT_SUBMITTED'
  | 'AI_ANALYSIS'
  | 'DEPARTMENT_REVIEW'
  | 'ADMIN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MORE_EVIDENCE_REQUIRED'
  | 'FIELD_INSPECTION_REQUIRED';

export type ComplaintStatus = 
  | 'NEW'
  | 'EVIDENCE_SUBMITTED'
  | 'WAITING_FOR_DEPARTMENT'
  | 'AWAITING_CITIZEN_EVIDENCE'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_RESOLUTION_EVIDENCE'
  | 'AI_VERIFICATION'
  | 'DEPARTMENT_REVIEW'
  | 'ADMIN_FINAL_REVIEW'
  | 'AWAITING_CITIZEN_VERIFICATION'
  | 'RESOLUTION_REJECTED'
  | 'FIELD_INSPECTION_REQUIRED'
  | 'ADDITIONAL_EVIDENCE_REQUIRED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'DUPLICATE'
  | 'REJECTED';

export type EscalationLevel = 'NONE' | 'LEVEL_1_SUPERVISOR' | 'LEVEL_2_ADMIN' | 'LEVEL_3_EXECUTIVE';

export type SlaStatus = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'ESCALATED';

export type AIVerificationDecision = 
  | 'LIKELY_RESOLVED'
  | 'POSSIBLY_RESOLVED'
  | 'UNCERTAIN'
  | 'NOT_RESOLVED'
  | 'INSUFFICIENT_EVIDENCE';

export type AIVerificationResult = 
  | 'MATCHED'
  | 'LIKELY_MATCH'
  | 'UNCERTAIN'
  | 'MISMATCH'
  | 'INSUFFICIENT_EVIDENCE'
  | AIVerificationDecision;

export type DepartmentHeadRecommendation = 
  | 'APPROVE_FOR_ADMIN_REVIEW'
  | 'REJECT_REQUEST_MORE_EVIDENCE'
  | 'FIELD_INSPECTION_REQUIRED'
  | 'NOT_RESOLVED';

export type AdminDecisionType = 
  | 'APPROVE_RESOLUTION'
  | 'REJECT_RESOLUTION'
  | 'REQUEST_FIELD_INSPECTION'
  | 'REQUEST_MORE_EVIDENCE'
  | 'REASSIGN_DEPARTMENT'
  | 'ESCALATE';

export type CitizenVerificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  badgeNumber?: string;
  area?: string;
  avatarUrl?: string;
  preferredLanguage?: 'en' | 'ta' | 'hi' | 'te';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  iconName: string;
  defaultSlaHours: number;
  officerCount: number;
  activeCases: number;
  resolvedCases: number;
  slaComplianceRate: number;
  performanceScore?: number;
  contactEmail: string;
  contactHelpline: string;
}

export interface Officer {
  id: string;
  name: string;
  badge: string;
  departmentId: string;
  departmentName: string;
  role: UserRole;
  phone: string;
  email: string;
  activeAssignments: number;
  resolvedCases: number;
  rating: number;
  avatar: string;
  zone?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode?: string;
}

export interface EvidenceRecord {
  id: string;
  ticketId: string;
  complaintId?: string;
  type: 'CITIZEN' | 'GOVERNMENT' | 'CITIZEN_ISSUE' | 'GOVERNMENT_RESOLUTION';
  imageUrl: string;
  storagePath?: string;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters?: number;
  accuracyMeters?: number;
  locationVerification?: 'VERIFIED' | 'UNVERIFIED';
  locationName: string;
  capturedAt: string;
  uploadedAt: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderRole: UserRole;
  metadataVerified: boolean;
  notes?: string;
  visualTags?: string[];
  deviceInfo?: string;
  status?: 'SUBMITTED' | 'PROCESSED' | 'FLAGGED';
}

export interface AIAnalysisReport {
  language: string;
  detectedLanguageCode: string;
  category: CivicCategory;
  subcategory: string;
  priority: PriorityLevel;
  departmentId: string;
  departmentName: string;
  confidenceScore: number;
  sentiment: SentimentType;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  keyEntities: {
    duration?: string;
    landmark?: string;
    affectedCount?: string;
    safetyRisk?: string;
  };
  safetyFlags: string[];
}

export interface ImageComparisonResult {
  visualSimilarity?: number; // 0.0 - 1.0
  locationConsistency?: number; // 0.0 - 1.0
  issueConsistency?: number; // 0.0 - 1.0
  repairDetected: boolean;
  imageQuality?: number; // 0.0 - 1.0
  overallConfidence?: number; // 0.0 - 1.0
  result?: AIVerificationDecision;
  reason?: string;
  distanceMeters?: number;
  gpsConsistency?: string;
  citizenGpsAccuracy?: number;
  governmentGpsAccuracy?: number;

  // Legacy / UI backward compatibility fields
  status: AIVerificationResult;
  confidence: number;
  evidenceMatchScore: number;
  visualSimilarityScore: number;
  locationMatchScore: number;
  analysisNotes: string;
  detectedFeatures: string[];
  rejectionReason?: string;
  comparedAt: string;
}

export interface Complaint {
  id: string;
  token: string; // e.g. "ROAD-2026-000123"
  citizenId: string;
  citizenName: string;
  citizenPhoneMasked?: string;
  
  category: CivicCategory;
  subcategory: string;
  title: string;
  description: string;
  aiSummary: string;
  
  location: GeoLocation;
  
  priority: PriorityLevel;
  riskScore: number; // 0 - 100
  status: ComplaintStatus;
  
  language: string;
  confidenceScore: number;
  sentiment: SentimentType;
  
  departmentId: string;
  departmentName: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedBy?: string;
  assignedByName?: string;
  inspectionDeadline?: string;
  officerInstructions?: string;
  
  clusterId?: string;
  relatedReportCount: number;
  
  slaHours: number;
  slaCreatedAt: string;
  slaDeadline: string;
  slaStatus: SlaStatus;
  
  escalationLevel: EscalationLevel;
  escalationReason?: string;
  escalatedAt?: string;
  
  // Geo-evidence fields
  citizenEvidenceId?: string;
  governmentEvidenceId?: string;
  evidenceStatus?: EvidenceStatus;
  citizenEvidence?: EvidenceRecord;
  governmentEvidence?: EvidenceRecord;
  
  // AI Verification
  aiVerification?: ImageComparisonResult;
  
  // Department Head Review
  departmentHeadReviewStatus?: 'PENDING' | 'RECOMMENDED' | 'REQUESTED_INSPECTION' | 'REQUESTED_EVIDENCE';
  departmentHeadRecommendation?: DepartmentHeadRecommendation;
  departmentHeadReviewReason?: string;
  departmentHeadReviewedBy?: string;
  departmentHeadReviewedByName?: string;
  departmentHeadReviewedAt?: string;
  
  // Main Admin Final Review & Decision
  adminReviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INSPECTION_REQUESTED' | 'MORE_EVIDENCE_REQUESTED' | 'REASSIGNED' | 'ESCALATED';
  adminDecision?: AdminDecisionType;
  adminDecisionReason?: string;
  adminDecisionBy?: string;
  adminDecisionByName?: string;
  adminDecisionAt?: string;
  
  // Citizen verification status & reason
  citizenVerificationStatus?: CitizenVerificationStatus;
  citizenVerificationReason?: string;
  citizenVerification?: {
    status: CitizenVerificationStatus;
    verifiedAt?: string;
    reason?: string;
    comment?: string;
    extraPhotoUrl?: string;
    rejectionCount: number;
  };
  
  officerNotes?: Array<{
    timestamp: string;
    officerName: string;
    note: string;
  }>;
  
  auditTrail?: AuditLogItem[];
  
  // Prolonged grievance & Main Head escalation
  prolongedDays?: number;
  escalatedToMainHead?: boolean;
  escalatedByCitizenAt?: string;
  citizenEscalationReason?: string;
  adminActionTaken?: {
    actionType: string;
    note: string;
    actionDate: string;
    adminName: string;
    sanctionDetails?: string;
  };
  
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  workStartedAt?: string;
  evidenceSubmittedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface IssueCluster {
  id: string;
  clusterCode: string;
  title: string;
  category: CivicCategory;
  subcategory: string;
  area: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  riskLevel: PriorityLevel;
  riskScore: number;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED';
  departmentName: string;
  firstReportedAt: string;
  latestReportedAt: string;
  complaintTokens: string[];
}

export interface TriggerRecord {
  id: string;
  triggerType: 
    | 'CRITICAL_ISSUE'
    | 'SLA_BREACH'
    | 'HIGH_RISK'
    | 'MULTIPLE_REPORTS'
    | 'HOTSPOT_DETECTED'
    | 'RECURRING_ISSUE'
    | 'LONG_UNRESOLVED'
    | 'RAPID_INCREASE'
    | 'AI_FLAG'
    | 'CITIZEN_REJECTED';
  ticketId: string;
  ticketToken: string;
  title: string;
  area: string;
  reportCount: number;
  daysUnresolved: number;
  priority: PriorityLevel;
  riskScore: number;
  departmentName: string;
  triggeredAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  actionRequired: string;
}

export interface AppNotification {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientId?: string;
  recipientDepartmentId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  ticketId?: string;
  ticketToken?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  performedBy?: string;
  performedByRole?: string;
  action: string;
  entityType: 'COMPLAINT' | 'EVIDENCE' | 'DEPARTMENT' | 'OFFICER' | 'ESCALATION' | 'SYSTEM' | 'SLA';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface ConversationTurn {
  id: string;
  speaker: 'citizen' | 'seva';
  text: string;
  timestamp: string;
  translatedText?: string;
  isQuestion?: boolean;
}

export interface ConversationRecord {
  id: string;
  citizenId: string;
  ticketId?: string;
  language: string;
  transcript: ConversationTurn[];
  summary: string;
  category: CivicCategory;
  subcategory: string;
  priority: PriorityLevel;
  department: string;
  sentiment: SentimentType;
  durationSec: number;
  createdAt: string;
}

export interface CivicHotspot {
  area: string;
  category: CivicCategory;
  count: number;
  riskScore: number;
  latitude: number;
  longitude: number;
  priority: PriorityLevel;
  trend: 'UP' | 'DOWN' | 'STABLE';
}
