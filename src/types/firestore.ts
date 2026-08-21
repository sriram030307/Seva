import { 
  UserRole, 
  CivicCategory, 
  PriorityLevel, 
  ComplaintStatus, 
  EscalationLevel, 
  SlaStatus, 
  AIVerificationResult, 
  CitizenVerificationStatus,
  SentimentType,
  EvidenceStatus,
  DepartmentHeadRecommendation,
  AdminDecisionType
} from './index';

export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  departmentId?: string; // 'ALL' for Admin or specific dept id like 'dept-water'
  departmentName?: string;
  badgeNumber?: string;
  designation?: string;
  area?: string;
  preferredLanguage?: 'en' | 'ta' | 'hi' | 'te';
  avatarUrl?: string;
  isActive: boolean;
  currentWorkload?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCitizen {
  citizenId: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  preferredLanguage: 'en' | 'ta' | 'hi' | 'te';
  totalReportsSubmitted: number;
  activeReportsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreDepartment {
  id: string;
  code: string;
  name: string;
  description: string;
  categories: string[];
  slaHours: number;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  officerCount?: number;
  activeCases?: number;
  resolvedCases?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreOfficer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  role: UserRole;
  designation: string;
  badgeNumber: string;
  isActive: boolean;
  currentWorkload: number;
  resolvedCases: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreEvidence {
  id: string;
  ticketId: string;
  complaintId?: string;
  complaintToken?: string;
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

export interface FirestoreComplaint {
  id: string;
  token: string;
  citizenId: string;
  citizenName: string;
  citizenPhoneMasked?: string;
  departmentId: string;
  departmentName: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedOfficerBadge?: string;
  assignedBy?: string;
  assignedByName?: string;
  inspectionDeadline?: string;
  officerInstructions?: string;

  category: CivicCategory | string;
  subcategory: string;
  title: string;
  description: string;
  aiSummary: string;
  language: string;

  // Spatial coordinates
  latitude: number;
  longitude: number;
  address?: string;
  area: string;
  city: string;
  state: string;
  locationSource?: 'GPS' | 'USER_SELECTED' | 'GEOCODED' | 'AI_MENTIONED';

  // Priority and Risk
  priority: PriorityLevel;
  aiPriority?: PriorityLevel;
  rulePriority?: PriorityLevel;
  priorityReason?: string;
  riskScore: number;
  status: ComplaintStatus;
  sentiment?: SentimentType;
  confidenceScore: number;

  // SLA & Escalation
  slaHours: number;
  slaCreatedAt: string;
  slaDeadline: string;
  slaStatus: SlaStatus;
  escalationLevel: EscalationLevel;

  // Evidence links
  citizenEvidenceId?: string;
  citizenEvidence?: FirestoreEvidence;
  governmentEvidenceId?: string;
  governmentEvidence?: FirestoreEvidence;
  evidenceStatus?: EvidenceStatus;

  // AI Verification
  aiVerificationResult?: AIVerificationResult;
  aiVerificationConfidence?: number;
  aiVerification?: {
    visualSimilarity?: number;
    locationConsistency?: number;
    issueConsistency?: number;
    repairDetected: boolean;
    imageQuality?: number;
    overallConfidence?: number;
    result?: string;
    reason?: string;
    distanceMeters?: number;
    gpsConsistency?: string;
    citizenGpsAccuracy?: number;
    governmentGpsAccuracy?: number;
    status: AIVerificationResult;
    confidence: number;
    evidenceMatchScore: number;
    visualSimilarityScore: number;
    locationMatchScore: number;
    analysisNotes: string;
    detectedFeatures?: string[];
    rejectionReason?: string;
    comparedAt: string;
  };

  // Department Head Review
  departmentHeadReviewStatus?: 'PENDING' | 'RECOMMENDED' | 'REQUESTED_INSPECTION' | 'REQUESTED_EVIDENCE';
  departmentHeadRecommendation?: DepartmentHeadRecommendation;
  departmentHeadReviewReason?: string;
  departmentHeadReviewedBy?: string;
  departmentHeadReviewedByName?: string;
  departmentHeadReviewedAt?: string;

  // Main Admin Final Decision
  adminReviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INSPECTION_REQUESTED' | 'MORE_EVIDENCE_REQUESTED' | 'REASSIGNED' | 'ESCALATED';
  adminDecision?: AdminDecisionType;
  adminDecisionReason?: string;
  adminDecisionBy?: string;
  adminDecisionByName?: string;
  adminDecisionAt?: string;

  // Citizen Final Verification
  citizenVerificationStatus?: CitizenVerificationStatus;
  citizenVerification?: CitizenVerificationStatus;
  citizenVerificationReason?: string;
  citizenVerificationComment?: string;
  citizenVerificationTimestamp?: string;
  rejectionCount?: number;

  // Cluster & Trend
  clusterId?: string;
  relatedReportCount?: number;

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface FirestoreAuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entityType: 'COMPLAINT' | 'USER' | 'DEPARTMENT' | 'EVIDENCE' | 'ESCALATION' | 'SYSTEM' | 'SETTING';
  entityId: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FirestoreTrigger {
  id: string;
  triggerType: 'CRITICAL_SAFETY' | 'SLA_BREACH' | 'MULTIPLE_REPORTS' | 'HIGH_RISK_HOTSPOT' | 'RECURRING_ISSUE' | 'RAPID_COMPLAINT_SPIKE' | 'LONG_UNRESOLVED' | 'LOW_AI_CONFIDENCE' | 'EVIDENCE_MISMATCH' | 'GPS_MISMATCH' | 'CITIZEN_REJECTED' | 'DEPARTMENT_INACTION' | 'CRITICAL_ISSUE';
  ticketId?: string;
  ticketToken?: string;
  title: string;
  area: string;
  reportCount: number;
  daysUnresolved: number;
  priority: PriorityLevel;
  riskScore: number;
  departmentName: string;
  triggeredAt: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'DISPATCHED' | 'RESOLVED';
  actionRequired: string;
}
