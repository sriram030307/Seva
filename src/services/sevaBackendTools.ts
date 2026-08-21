import { 
  CivicCategory, 
  PriorityLevel, 
  SentimentType, 
  Complaint, 
  GeoLocation, 
  IssueCluster, 
  Department,
  UserProfile
} from '../types';
import { sevaStore } from './store';
import { db, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from './firebase';

export interface CreateComplaintBackendPayload {
  citizenId: string;
  citizenName: string;
  citizenPhoneMasked?: string;
  category: CivicCategory;
  subcategory: string;
  title: string;
  description: string;
  aiSummary: string;
  location: GeoLocation;
  aiPriority: PriorityLevel;
  sentiment: SentimentType;
  confidenceScore: number;
  language: string;
  departmentId?: string;
  evidencePhotoBase64?: string;
}

export interface DuplicateCheckResult {
  isDuplicateCandidate: boolean;
  candidateToken?: string;
  candidateTitle?: string;
  distanceMeters?: number;
  similarityScore: number;
  reason?: string;
}

export interface PriorityEvaluationResult {
  aiPriority: PriorityLevel;
  rulePriority: PriorityLevel;
  finalPriority: PriorityLevel;
  safetyFlags: string[];
  reason: string;
  source: 'RULE' | 'AI' | 'RULE + AI';
}

export class SevaBackendToolsService {
  /**
   * Tool 1: getCitizenLocation
   */
  public async getCitizenLocation(fallbackLat?: number, fallbackLng?: number): Promise<GeoLocation> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              address: 'Madipakkam Main Road, Near Bus Depot',
              area: 'Madipakkam',
              landmark: 'Opposite State Bank ATM',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '600091'
            });
          },
          () => {
            resolve({
              latitude: fallbackLat || 12.9647,
              longitude: fallbackLng || 80.1961,
              address: 'Madipakkam Main Road, Ward 168',
              area: 'Madipakkam',
              landmark: 'Near City Union Bank',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '600091'
            });
          },
          { timeout: 4000 }
        );
      } else {
        resolve({
          latitude: fallbackLat || 12.9647,
          longitude: fallbackLng || 80.1961,
          address: 'Madipakkam Main Road, Ward 168',
          area: 'Madipakkam',
          landmark: 'Near City Union Bank',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600091'
        });
      }
    });
  }

  /**
   * Tool 2: getNearbyComplaints
   */
  public async getNearbyComplaints(lat: number, lng: number, radiusKm = 1.5): Promise<Complaint[]> {
    const all = sevaStore.getComplaints();
    return all.filter((c) => {
      const dist = this.calculateDistanceMeters(lat, lng, c.location.latitude, c.location.longitude);
      return dist <= radiusKm * 1000;
    });
  }

  /**
   * Tool 3: getDepartments
   */
  public async getDepartments(): Promise<Department[]> {
    return sevaStore.getDepartments();
  }

  /**
   * Tool 4: checkDuplicateComplaint
   */
  public async checkDuplicateComplaint(
    category: CivicCategory,
    lat: number,
    lng: number,
    description: string
  ): Promise<DuplicateCheckResult> {
    const nearby = await this.getNearbyComplaints(lat, lng, 0.4); // 400m radius
    const categoryMatches = nearby.filter((c) => c.category === category && c.status !== 'CLOSED' && c.status !== 'RESOLVED');

    if (categoryMatches.length === 0) {
      return {
        isDuplicateCandidate: false,
        similarityScore: 10
      };
    }

    // Semantic / keyword similarity check
    const descWords = new Set(description.toLowerCase().split(/\s+/));
    let bestMatch: Complaint | null = null;
    let highestScore = 0;
    let minDistance = 99999;

    for (const match of categoryMatches) {
      const dist = this.calculateDistanceMeters(lat, lng, match.location.latitude, match.location.longitude);
      const matchWords = match.description.toLowerCase().split(/\s+/);
      const common = matchWords.filter((w) => descWords.has(w) && w.length > 3);
      
      const textScore = Math.min(60, common.length * 15);
      const distScore = dist <= 50 ? 40 : dist <= 150 ? 25 : 10;
      const totalScore = textScore + distScore;

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = match;
        minDistance = dist;
      }
    }

    if (highestScore >= 55 && bestMatch) {
      return {
        isDuplicateCandidate: true,
        candidateToken: (bestMatch as Complaint).token,
        candidateTitle: (bestMatch as Complaint).title,
        distanceMeters: Math.round(minDistance),
        similarityScore: Math.min(96, highestScore + 20),
        reason: `Existing open record ${(bestMatch as Complaint).token} (${(bestMatch as Complaint).title}) registered ${Math.round(minDistance)}m away in same zone.`
      };
    }

    return {
      isDuplicateCandidate: false,
      similarityScore: highestScore
    };
  }

  /**
   * Tool 5: getComplaintStatus
   */
  public async getComplaintStatus(token: string): Promise<Complaint | null> {
    const cleanToken = token.trim().toUpperCase();
    const found = sevaStore.getComplaints().find((c) => c.token.toUpperCase() === cleanToken || c.id === token);
    return found || null;
  }

  /**
   * Tool 6: Deterministic Priority & Safety Rules Engine
   */
  public evaluatePriority(
    category: CivicCategory,
    userText: string,
    aiSuggestedPriority: PriorityLevel
  ): PriorityEvaluationResult {
    const text = userText.toLowerCase();
    const safetyFlags: string[] = [];
    let rulePriority: PriorityLevel = 'LOW';
    let ruleReason = '';

    // CRITICAL Deterministic Rules
    if (
      text.includes('live wire') || 
      text.includes('snapped wire') || 
      text.includes('sparking') || 
      text.includes('electrocution') || 
      text.includes('shock') || 
      text.includes('transformer blast') ||
      text.includes('மின்கம்பி') || 
      text.includes('கரண்ட் ஷாக்')
    ) {
      rulePriority = 'CRITICAL';
      safetyFlags.push('ELECTROCUTION_HAZARD');
      ruleReason = 'Live electrical line or electrocution risk detected.';
    } else if (
      text.includes('fire') || 
      text.includes('gas leak') || 
      text.includes('தீ') || 
      text.includes('gas') || 
      text.includes('explosion')
    ) {
      rulePriority = 'CRITICAL';
      safetyFlags.push('FIRE_HAZARD');
      ruleReason = 'Immediate combustion or explosive gas hazard.';
    } else if (
      text.includes('severe flood') || 
      text.includes('drowning') || 
      text.includes('house submerged') || 
      text.includes('வெள்ளம்')
    ) {
      rulePriority = 'CRITICAL';
      safetyFlags.push('FLOOD_HAZARD');
      ruleReason = 'Dangerous inundation threatening life or property.';
    } else if (
      text.includes('structural collapse') || 
      text.includes('bridge crack') || 
      text.includes('building fall') || 
      text.includes('massive cave-in')
    ) {
      rulePriority = 'CRITICAL';
      safetyFlags.push('STRUCTURAL_COLLAPSE_RISK');
      ruleReason = 'Structural failure risk threatening public safety.';
    } else if (
      text.includes('deep pothole') || 
      text.includes('open manhole') || 
      text.includes('periya pothole') || 
      text.includes('சாக்கடை மூடி') || 
      text.includes('water supply cut') || 
      text.includes('no water') || 
      text.includes('sewage overflow')
    ) {
      rulePriority = 'HIGH';
      safetyFlags.push('ROAD_OR_HEALTH_HAZARD');
      ruleReason = 'Hazardous road cavity, open chamber, or acute utility disruption.';
    } else if (
      text.includes('overflowing bin') || 
      text.includes('garbage') || 
      text.includes('street light') || 
      text.includes('streetlight not working') || 
      text.includes('குப்பை')
    ) {
      rulePriority = 'MEDIUM';
      ruleReason = 'Standard municipal maintenance grievance.';
    }

    // Resolve Final Priority: Safety rules take highest precedence
    const priorityWeights: Record<PriorityLevel, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    let finalPriority = aiSuggestedPriority;
    let source: 'RULE' | 'AI' | 'RULE + AI' = 'AI';

    if (priorityWeights[rulePriority] > priorityWeights[aiSuggestedPriority]) {
      finalPriority = rulePriority;
      source = 'RULE';
    } else if (priorityWeights[rulePriority] === priorityWeights[aiSuggestedPriority] && rulePriority !== 'LOW') {
      finalPriority = rulePriority;
      source = 'RULE + AI';
    }

    return {
      aiPriority: aiSuggestedPriority,
      rulePriority,
      finalPriority,
      safetyFlags,
      reason: ruleReason || `AI classified based on contextual impact (${aiSuggestedPriority}).`,
      source
    };
  }

  /**
   * Tool 7: createComplaint (Official Backend Ticket Generator)
   * The backend validates input, assigns unique token, SLA, audit log & triggers
   */
  public async createComplaintBackend(payload: CreateComplaintBackendPayload): Promise<{
    success: boolean;
    token: string;
    complaint: Complaint;
    clusterId?: string;
  }> {
    // 1. Department resolution & validation
    const departments = sevaStore.getDepartments();
    let targetDept = departments.find((d) => d.id === payload.departmentId);

    if (!targetDept) {
      const catMap: Record<CivicCategory, string> = {
        ROAD: 'GCC-ENG',
        WATER: 'CMWSSB',
        ELECTRICITY: 'TANGEDCO',
        GARBAGE: 'GCC-SWM',
        TRANSPORT: 'MTC-TRAF',
        HEALTHCARE: 'GCC-PUBHLTH',
        POLICE: 'TNP-TRAF',
        DISASTER: 'TNDMA'
      };
      const deptCode = catMap[payload.category] || 'GCC-ENG';
      targetDept = departments.find((d) => d.code === deptCode) || departments[0];
    }

    // 2. Generate Official Unique Token e.g. ROAD-2026-000124
    const prefixMap: Record<CivicCategory, string> = {
      ROAD: 'ROAD',
      WATER: 'WTR',
      ELECTRICITY: 'ELEC',
      GARBAGE: 'SWM',
      TRANSPORT: 'TRN',
      HEALTHCARE: 'HLTH',
      POLICE: 'POL',
      DISASTER: 'EMRG'
    };
    const prefix = prefixMap[payload.category] || 'SEVA';
    const year = new Date().getFullYear();
    const existingCount = sevaStore.getComplaints().length;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const token = `${prefix}-${year}-${String(existingCount + 1).padStart(3, '0')}${randomSuffix}`;

    // 3. Evaluate Priority & Safety rules
    const prioEval = this.evaluatePriority(payload.category, `${payload.title} ${payload.description}`, payload.aiPriority);

    // 4. Calculate SLA
    const slaHours = targetDept.defaultSlaHours || (prioEval.finalPriority === 'CRITICAL' ? 8 : prioEval.finalPriority === 'HIGH' ? 24 : 48);
    const now = new Date();
    const deadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    // 5. Build full Complaint record
    const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newComplaint: Complaint = {
      id,
      token,
      citizenId: payload.citizenId,
      citizenName: payload.citizenName,
      citizenPhoneMasked: payload.citizenPhoneMasked || '+91 98401 •••••',
      category: payload.category,
      subcategory: payload.subcategory,
      title: payload.title,
      description: payload.description,
      aiSummary: payload.aiSummary || payload.description,
      location: payload.location,
      priority: prioEval.finalPriority,
      riskScore: prioEval.finalPriority === 'CRITICAL' ? 95 : prioEval.finalPriority === 'HIGH' ? 78 : 45,
      status: payload.evidencePhotoBase64 ? 'VERIFIED' : 'AWAITING_CITIZEN_EVIDENCE',
      language: payload.language || 'en',
      confidenceScore: payload.confidenceScore || 94,
      sentiment: payload.sentiment || 'CONCERNED',
      departmentId: targetDept.id,
      departmentName: targetDept.name,
      relatedReportCount: 1,
      slaHours,
      slaCreatedAt: now.toISOString(),
      slaDeadline: deadline.toISOString(),
      slaStatus: 'ON_TRACK',
      escalationLevel: 'NONE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    if (payload.evidencePhotoBase64) {
      newComplaint.citizenEvidence = {
        id: `ev_cit_${Date.now()}`,
        ticketId: id,
        type: 'CITIZEN',
        imageUrl: payload.evidencePhotoBase64,
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        locationName: payload.location.address || payload.location.area,
        capturedAt: now.toISOString(),
        uploadedAt: now.toISOString(),
        uploadedBy: payload.citizenId,
        uploaderName: payload.citizenName,
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        visualTags: [payload.category.toLowerCase(), payload.subcategory.toLowerCase()]
      };
    }

    // Save to store (and push to Firestore if configured)
    await sevaStore.addComplaint(newComplaint);

    // If critical, trigger emergency record
    if (prioEval.finalPriority === 'CRITICAL') {
      sevaStore.createTriggerRecord({
        triggerType: 'CRITICAL_ISSUE',
        ticketId: id,
        ticketToken: token,
        title: `CRITICAL HAZARD: ${payload.title}`,
        area: payload.location.area,
        reportCount: 1,
        daysUnresolved: 0,
        priority: 'CRITICAL',
        riskScore: 98,
        departmentName: targetDept.name,
        actionRequired: 'Immediate emergency field unit dispatch & safety cordon required.'
      });
    }

    return {
      success: true,
      token,
      complaint: newComplaint,
      clusterId: newComplaint.clusterId
    };
  }

  /**
   * Tool 8: getIssueCluster
   */
  public async getIssueCluster(lat: number, lng: number, category: CivicCategory): Promise<IssueCluster | null> {
    const clusters = sevaStore.getClusters();
    const match = clusters.find((c) => {
      if (c.category !== category) return false;
      const d = this.calculateDistanceMeters(lat, lng, c.latitude, c.longitude);
      return d <= 500;
    });
    return match || null;
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}

export const sevaBackendTools = new SevaBackendToolsService();
