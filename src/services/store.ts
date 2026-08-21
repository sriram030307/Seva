import { 
  Complaint, 
  Department, 
  Officer, 
  IssueCluster, 
  TriggerRecord, 
  AppNotification, 
  AuditLogItem, 
  UserProfile,
  EvidenceRecord,
  ImageComparisonResult,
  CivicCategory,
  PriorityLevel,
  SentimentType,
  ComplaintStatus,
  EscalationLevel,
  GeoLocation,
  DepartmentHeadRecommendation,
  AdminDecisionType
} from '../types';
import { sevaAiVisionService } from './aiVisionService';
import { 
  DEMO_USERS, 
  DEPARTMENTS, 
  OFFICERS, 
  ISSUE_CLUSTERS, 
  TRIGGER_RECORDS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS,
  generateSeedComplaints 
} from './mockData';
import { db, doc, setDoc, onSnapshot, collection, isFirebaseConfigured } from './firebase';
import { firebaseSeedService } from './firebaseSeed';

const STORAGE_KEYS = {
  COMPLAINTS: 'seva_complaints_v1',
  CURRENT_USER: 'seva_current_user_v1',
  DEPARTMENTS: 'seva_departments_v1',
  OFFICERS: 'seva_officers_v1',
  CLUSTERS: 'seva_clusters_v1',
  TRIGGERS: 'seva_triggers_v1',
  NOTIFICATIONS: 'seva_notifications_v1',
  AUDIT_LOGS: 'seva_audit_logs_v1',
  SETTINGS: 'seva_settings_v1'
};

type StateListener = () => void;

class SevaDataStore {
  private complaints: Complaint[] = [];
  private currentUser: UserProfile = DEMO_USERS[0]; // Default user
  private departments: Department[] = DEPARTMENTS;
  private officers: Officer[] = OFFICERS;
  private clusters: IssueCluster[] = ISSUE_CLUSTERS;
  private triggers: TriggerRecord[] = TRIGGER_RECORDS;
  private notifications: AppNotification[] = INITIAL_NOTIFICATIONS;
  private auditLogs: AuditLogItem[] = INITIAL_AUDIT_LOGS;
  private listeners: Set<StateListener> = new Set();
  private isFirebaseListenerActive = false;

  constructor() {
    this.loadFromStorage();
    this.initFirebaseSync();
    // Run automated SLA breach check on startup
    this.checkAndTriggerSlaBreaches();
    // Start background automated watchdog (every 20 seconds)
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.checkAndTriggerSlaBreaches();
      }, 20000);
    }
  }

  private initFirebaseSync() {
    if (typeof window === 'undefined') return;
    
    // Seed Firestore if online
    firebaseSeedService.seedInitialDataIfNeeded().catch(err => {
      console.warn('Firebase seeding status:', err);
    });

    if (db && isFirebaseConfigured() && !this.isFirebaseListenerActive) {
      try {
        this.isFirebaseListenerActive = true;
        const complaintsCol = collection(db, 'complaints');
        onSnapshot(complaintsCol, (snapshot) => {
          if (!snapshot.empty) {
            const remoteComplaints: Complaint[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as any;
              remoteComplaints.push({
                ...data,
                id: docSnap.id,
                location: data.location || {
                  latitude: data.latitude || 12.9654,
                  longitude: data.longitude || 80.1983,
                  area: data.area || 'Madipakkam',
                  city: data.city || 'Chennai',
                  state: data.state || 'Tamil Nadu',
                  address: data.address
                }
              });
            });

            if (remoteComplaints.length > 0) {
              // Merge remote complaints with local
              const existingMap = new Map(this.complaints.map(c => [c.id, c]));
              remoteComplaints.forEach(rc => {
                existingMap.set(rc.id, rc);
              });
              this.complaints = Array.from(existingMap.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              this.saveComplaints(false); // save to storage without re-pushing
            }
          }
        }, (error) => {
          console.warn('Firestore real-time subscription note:', error);
        });
      } catch (e) {
        console.warn('Firebase sync listener error:', e);
      }
    }
  }

  private loadFromStorage() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }

      const savedComplaints = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (savedComplaints) {
        this.complaints = JSON.parse(savedComplaints);
      } else {
        this.complaints = generateSeedComplaints();
        this.saveComplaints();
      }

      const savedDepts = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      if (savedDepts) this.departments = JSON.parse(savedDepts);

      const savedOfficers = localStorage.getItem(STORAGE_KEYS.OFFICERS);
      if (savedOfficers) this.officers = JSON.parse(savedOfficers);

      const savedClusters = localStorage.getItem(STORAGE_KEYS.CLUSTERS);
      if (savedClusters) this.clusters = JSON.parse(savedClusters);

      const savedTriggers = localStorage.getItem(STORAGE_KEYS.TRIGGERS);
      if (savedTriggers) this.triggers = JSON.parse(savedTriggers);

      const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (savedNotifs) this.notifications = JSON.parse(savedNotifs);

      const savedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (savedLogs) this.auditLogs = JSON.parse(savedLogs);
    } catch (e) {
      console.error('Error loading SEVA state from storage, falling back to seed:', e);
      this.complaints = generateSeedComplaints();
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    });
  }

  private saveComplaints(syncToFirestore = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(this.complaints));
      if (syncToFirestore && db && isFirebaseConfigured() && this.complaints.length > 0) {
        // Sync the latest/modified complaints to Firestore
        const latest = this.complaints[0];
        if (latest) {
          const compRef = doc(db, 'complaints', latest.id);
          setDoc(compRef, {
            ...latest,
            latitude: latest.location.latitude,
            longitude: latest.location.longitude,
            area: latest.location.area,
            city: latest.location.city,
            state: latest.location.state,
            address: latest.location.address || '',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.warn('Firestore complaint write note:', err));
        }
      }
    } catch (e) {
      console.error('Failed to save complaints:', e);
    }
    this.notify();
  }

  private saveTriggers() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(this.triggers));
      if (db && isFirebaseConfigured() && this.triggers.length > 0) {
        const latest = this.triggers[0];
        if (latest) {
          const trigRef = doc(db, 'triggers', latest.id);
          setDoc(trigRef, latest, { merge: true }).catch(err => console.warn('Firestore trigger write note:', err));
        }
      }
    } catch (e) {
      console.error('Failed to save triggers:', e);
    }
    this.notify();
  }

  private saveNotifications() {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
    this.notify();
  }

  private saveAuditLogs() {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      if (db && isFirebaseConfigured() && this.auditLogs.length > 0) {
        const latest = this.auditLogs[0];
        if (latest) {
          const logRef = doc(db, 'auditLogs', latest.id);
          setDoc(logRef, latest, { merge: true }).catch(err => console.warn('Firestore auditLog write note:', err));
        }
      }
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
    this.notify();
  }

  // --- Auth & User ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.logAudit({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entityType: 'SYSTEM',
      entityId: user.id,
      details: `User logged in as ${user.role} (${user.name})`
    });
    this.notify();
  }

  public getAllDemoUsers(): UserProfile[] {
    return DEMO_USERS;
  }

  // --- Complaints ---
  public getComplaints(): Complaint[] {
    return [...this.complaints];
  }

  public getComplaintById(idOrToken: string): Complaint | undefined {
    return this.complaints.find(c => c.id === idOrToken || c.token.toLowerCase() === idOrToken.toLowerCase());
  }

  public getComplaintByToken(token: string): Complaint | undefined {
    return this.complaints.find(c => c.token.toLowerCase() === token.toLowerCase().trim() || c.id === token.trim());
  }

  public getComplaintsByCitizen(citizenId: string): Complaint[] {
    return this.complaints.filter(c => c.citizenId === citizenId);
  }

  public getComplaintsByDepartment(deptId: string): Complaint[] {
    return this.complaints.filter(c => c.departmentId === deptId);
  }

  // Backend ticket token generator e.g. "ROAD-2026-000124"
  private generateTicketToken(category: CivicCategory): string {
    const prefixes: Record<CivicCategory, string> = {
      ROAD: 'ROAD',
      WATER: 'WTR',
      ELECTRICITY: 'ELEC',
      GARBAGE: 'GARB',
      TRANSPORT: 'TRANS',
      HEALTHCARE: 'HLTH',
      POLICE: 'POL',
      DISASTER: 'DM'
    };
    const prefix = prefixes[category] || 'SEVA';
    const nextSeq = this.complaints.length + 101;
    const tokenNum = String(nextSeq).padStart(6, '0');
    return `${prefix}-2026-${tokenNum}`;
  }

  // Create Complaint (called after citizen voice / manual confirmation)
  public createComplaint(data: {
    category: CivicCategory;
    subcategory: string;
    title: string;
    description: string;
    aiSummary: string;
    location: GeoLocation;
    priority: PriorityLevel;
    language?: string;
    confidenceScore?: number;
    sentiment?: SentimentType;
    departmentId?: string;
    clusterId?: string;
    citizenEvidencePhoto?: string;
  }): Complaint {
    const dept = this.departments.find(d => d.id === data.departmentId) || 
      this.departments.find(d => d.code === data.category) || 
      this.departments[0];

    const token = this.generateTicketToken(data.category);
    const now = new Date().toISOString();
    const slaHours = dept.defaultSlaHours || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    const riskScore = data.priority === 'CRITICAL' ? 95 : 
      data.priority === 'HIGH' ? 78 : 
      data.priority === 'MEDIUM' ? 45 : 20;

    const newComplaintId = `cmp-${Date.now()}`;

    let citizenEvidence: EvidenceRecord | undefined = undefined;
    if (data.citizenEvidencePhoto) {
      citizenEvidence = {
        id: `ev-c-${Date.now()}`,
        ticketId: newComplaintId,
        type: 'CITIZEN',
        imageUrl: data.citizenEvidencePhoto,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        locationName: `${data.location.area || 'Current Location'} (GPS Captured)`,
        capturedAt: now,
        uploadedAt: now,
        uploadedBy: this.currentUser.id,
        uploaderName: this.currentUser.name,
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        notes: 'Captured via SEVA Citizen camera with verified device geolocation.',
        visualTags: [data.subcategory.toLowerCase(), 'civic defect', 'citizen report']
      };
    }

    const newComplaint: Complaint = {
      id: newComplaintId,
      token,
      citizenId: this.currentUser.id,
      citizenName: this.currentUser.name,
      citizenPhoneMasked: this.currentUser.phone ? this.currentUser.phone.replace(/(\+91 \d{5}) \d{5}/, '$1 •••••') : '+91 98401 •••••',
      category: data.category,
      subcategory: data.subcategory,
      title: data.title,
      description: data.description,
      aiSummary: data.aiSummary,
      location: data.location,
      priority: data.priority,
      riskScore,
      status: citizenEvidence ? 'VERIFIED' : 'AWAITING_CITIZEN_EVIDENCE',
      language: data.language || 'English',
      confidenceScore: data.confidenceScore || 92,
      sentiment: data.sentiment || 'CONCERNED',
      departmentId: dept.id,
      departmentName: dept.name,
      clusterId: data.clusterId,
      relatedReportCount: 1,
      slaHours,
      slaCreatedAt: now,
      slaDeadline,
      slaStatus: 'ON_TRACK',
      escalationLevel: 'NONE',
      citizenEvidence,
      createdAt: now,
      updatedAt: now
    };

    // Prepend to complaints list
    this.complaints.unshift(newComplaint);
    this.saveComplaints();

    // Check if critical trigger record is needed
    if (data.priority === 'CRITICAL') {
      this.triggers.unshift({
        id: `trig-${Date.now()}`,
        triggerType: 'CRITICAL_ISSUE',
        ticketId: newComplaint.id,
        ticketToken: newComplaint.token,
        title: newComplaint.title,
        area: newComplaint.location.area,
        reportCount: 1,
        daysUnresolved: 0,
        priority: 'CRITICAL',
        riskScore: newComplaint.riskScore,
        departmentName: dept.name,
        triggeredAt: now,
        status: 'ACTIVE',
        actionRequired: 'Immediate emergency dispatch & perimeter isolation required'
      });
      this.saveTriggers();
    }

    // Add in-app notification for Government and Citizen
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'CITIZEN',
      recipientId: this.currentUser.id,
      title: `Grievance Registered: ${newComplaint.token}`,
      message: `Your report has been routed to ${dept.name}. SLA target: ${slaHours} hours.`,
      type: 'SUCCESS',
      ticketId: newComplaint.id,
      ticketToken: newComplaint.token,
      timestamp: now,
      read: false,
      actionUrl: `/citizen/reports/${newComplaint.id}`
    });

    this.notifications.unshift({
      id: `notif-gov-${Date.now()}`,
      recipientRole: 'OFFICER',
      title: `New Ticket: ${newComplaint.token} [${data.priority}]`,
      message: `${newComplaint.title} registered in ${data.location.area}. Assigned to ${dept.name}.`,
      type: data.priority === 'CRITICAL' ? 'ALERT' : 'INFO',
      ticketId: newComplaint.id,
      ticketToken: newComplaint.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${newComplaint.id}`
    });
    this.saveNotifications();

    // Log audit
    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: 'CITIZEN',
      action: 'COMPLAINT_CREATED',
      entityType: 'COMPLAINT',
      entityId: newComplaint.token,
      details: `Complaint ${token} created via SEVA AI Voice Agent. Category: ${data.category}, Priority: ${data.priority}, Routed to: ${dept.name}`
    });

    return newComplaint;
  }

  // Citizen adds Geo-Tagged Issue Image
  public addCitizenEvidence(ticketId: string, evidenceData: {
    imageUrl: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    locationVerification?: 'VERIFIED' | 'UNVERIFIED';
    locationName?: string;
    notes?: string;
    deviceInfo?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const evidenceId = `ev-c-${Date.now()}`;
    const isVerified = evidenceData.locationVerification !== 'UNVERIFIED';
    
    const evidence: EvidenceRecord = {
      id: evidenceId,
      ticketId: comp.id,
      complaintId: comp.id,
      type: 'CITIZEN_ISSUE',
      imageUrl: evidenceData.imageUrl,
      storagePath: `citizen-evidence/${comp.id}/${evidenceId}.jpg`,
      latitude: evidenceData.latitude,
      longitude: evidenceData.longitude,
      gpsAccuracyMeters: evidenceData.accuracyMeters || 8,
      accuracyMeters: evidenceData.accuracyMeters || 8,
      locationVerification: isVerified ? 'VERIFIED' : 'UNVERIFIED',
      locationName: evidenceData.locationName || `${comp.location.area} (${isVerified ? 'GPS Verified' : 'Unverified GPS'})`,
      capturedAt: now,
      uploadedAt: now,
      uploadedBy: this.currentUser.id,
      uploaderName: this.currentUser.name,
      uploaderRole: 'CITIZEN',
      metadataVerified: isVerified,
      notes: evidenceData.notes || 'Citizen camera capture with verified GPS metadata.',
      deviceInfo: evidenceData.deviceInfo || navigator.userAgent,
      status: 'SUBMITTED',
      visualTags: [comp.subcategory.toLowerCase(), 'citizen evidence', isVerified ? 'location verified' : 'unverified location']
    };

    comp.citizenEvidenceId = evidence.id;
    comp.citizenEvidence = evidence;
    comp.evidenceStatus = 'CITIZEN_SUBMITTED';
    comp.status = 'WAITING_FOR_DEPARTMENT';
    comp.updatedAt = now;

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: 'CITIZEN',
      action: 'CITIZEN_EVIDENCE_UPLOADED',
      entityType: 'EVIDENCE',
      entityId: comp.token,
      details: `Citizen uploaded geo-evidence (${evidence.locationVerification}) for ${comp.token}. GPS: ${evidence.latitude.toFixed(5)}, ${evidence.longitude.toFixed(5)} (±${evidence.accuracyMeters}m).`
    });

    // Notify Department Head
    this.notifications.unshift({
      id: `notif-dh-${Date.now()}`,
      recipientRole: 'DEPARTMENT_ADMIN',
      recipientDepartmentId: comp.departmentId,
      title: `New Evidence Submitted: ${comp.token}`,
      message: `Citizen uploaded verified photographic evidence for ${comp.title}. Please assign a field officer.`,
      type: 'INFO',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });
    this.saveNotifications();

    return comp;
  }

  // Department Head assigns Field Employee with Deadlines & Instructions
  public assignOfficer(ticketId: string, officerId: string, options?: {
    deadline?: string;
    instructions?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const officer = this.officers.find(o => o.id === officerId) || this.officers[0];
    const now = new Date().toISOString();

    comp.assignedOfficerId = officer.id;
    comp.assignedOfficerName = officer.name;
    comp.assignedBy = this.currentUser.id;
    comp.assignedByName = this.currentUser.name;
    comp.assignedAt = now;
    if (options?.deadline) comp.inspectionDeadline = options.deadline;
    if (options?.instructions) comp.officerInstructions = options.instructions;
    
    comp.status = 'ASSIGNED';
    comp.evidenceStatus = comp.citizenEvidence ? 'WAITING_FOR_GOVERNMENT' : 'NOT_SUBMITTED';
    comp.updatedAt = now;

    // Add internal officer note
    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `Assigned to field officer ${officer.name} (${officer.badge || 'Field Specialist'}). ${options?.instructions ? `Instructions: ${options.instructions}` : ''}`
    });

    this.saveComplaints();

    // Notify Assigned Officer
    this.notifications.unshift({
      id: `notif-off-${Date.now()}`,
      recipientRole: 'OFFICER',
      recipientId: officer.id,
      title: `Task Assigned: ${comp.token}`,
      message: `You have been assigned to inspect and resolve ${comp.title} at ${comp.location.address}.`,
      type: 'INFO',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });
    this.saveNotifications();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'EMPLOYEE_ASSIGNED',
      entityType: 'COMPLAINT',
      entityId: comp.token,
      details: `Department Head assigned ${officer.name} to ${comp.token}. Instructions: ${options?.instructions || 'Standard remediation protocol'}`
    });

    return comp;
  }

  // Start Work
  public startWorkOnComplaint(ticketId: string, note?: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    comp.status = 'IN_PROGRESS';
    comp.workStartedAt = now;
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: note || 'On-site investigation commenced and work gang deployed.'
    });

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'WORK_STARTED',
      entityType: 'COMPLAINT',
      entityId: comp.token,
      details: `Officer commenced remediation work on ${comp.token}.`
    });

    return comp;
  }

  // Upload Government Resolution Evidence + Run AI Verification Engine
  public async uploadResolutionEvidence(ticketId: string, evidenceData: {
    imageUrl: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    locationVerification?: 'VERIFIED' | 'UNVERIFIED';
    locationName?: string;
    notes: string;
    deviceInfo?: string;
    simulatedQuality?: 'PERFECT' | 'GOOD' | 'UNCERTAIN' | 'MISMATCH';
  }): Promise<{ complaint: Complaint; aiResult: ImageComparisonResult } | undefined> {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const evidenceId = `ev-g-${Date.now()}`;
    const isVerified = evidenceData.locationVerification !== 'UNVERIFIED';

    const govEvidence: EvidenceRecord = {
      id: evidenceId,
      ticketId: comp.id,
      complaintId: comp.id,
      type: 'GOVERNMENT_RESOLUTION',
      imageUrl: evidenceData.imageUrl,
      storagePath: `government-evidence/${comp.id}/${evidenceId}.jpg`,
      latitude: evidenceData.latitude,
      longitude: evidenceData.longitude,
      gpsAccuracyMeters: evidenceData.accuracyMeters || 7,
      accuracyMeters: evidenceData.accuracyMeters || 7,
      locationVerification: isVerified ? 'VERIFIED' : 'UNVERIFIED',
      locationName: evidenceData.locationName || `${comp.location.area} Government Geo-Pin`,
      capturedAt: now,
      uploadedAt: now,
      uploadedBy: this.currentUser.id,
      uploaderName: this.currentUser.name,
      uploaderRole: this.currentUser.role,
      metadataVerified: isVerified,
      notes: evidenceData.notes,
      deviceInfo: evidenceData.deviceInfo || navigator.userAgent,
      status: 'SUBMITTED',
      visualTags: ['repaired surface', 'government resolution', isVerified ? 'geo-tagged verified' : 'unverified geo-tag']
    };

    comp.governmentEvidenceId = govEvidence.id;
    comp.governmentEvidence = govEvidence;
    comp.evidenceStatus = 'GOVERNMENT_SUBMITTED';
    comp.evidenceSubmittedAt = now;
    comp.updatedAt = now;

    // Run AI Comparison Model (Assistive Verification)
    let aiResult: ImageComparisonResult;
    if (comp.citizenEvidence) {
      aiResult = await sevaAiVisionService.compareEvidence(comp.citizenEvidence, govEvidence);
    } else {
      aiResult = {
        visualSimilarity: 0.85,
        locationConsistency: 0.85,
        issueConsistency: 0.85,
        repairDetected: true,
        imageQuality: 0.90,
        overallConfidence: 0.85,
        result: 'LIKELY_RESOLVED',
        reason: 'Government resolution photo uploaded without baseline citizen image comparison.',
        distanceMeters: 0,
        gpsConsistency: 'NO BASELINE IMAGE',
        status: 'LIKELY_MATCH',
        confidence: 85,
        evidenceMatchScore: 85,
        visualSimilarityScore: 85,
        locationMatchScore: 85,
        analysisNotes: 'Government resolution photo uploaded with verified metadata.',
        detectedFeatures: ['repair documented'],
        comparedAt: now
      };
    }

    comp.aiVerification = aiResult;
    comp.evidenceStatus = 'DEPARTMENT_REVIEW';
    comp.status = 'DEPARTMENT_REVIEW';
    comp.departmentHeadReviewStatus = 'PENDING';

    this.saveComplaints();

    // Log Audits
    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'GOVERNMENT_EVIDENCE_UPLOADED',
      entityType: 'EVIDENCE',
      entityId: comp.token,
      details: `Field Officer ${this.currentUser.name} uploaded remediation photo with GPS: ${govEvidence.latitude.toFixed(5)}, ${govEvidence.longitude.toFixed(5)} (±${govEvidence.accuracyMeters}m).`
    });

    this.logAudit({
      userId: 'system-ai-engine',
      userName: 'SEVA AI Vision Assistive Engine',
      role: 'SUPERVISOR',
      action: 'AI_EVIDENCE_ANALYSIS',
      entityType: 'EVIDENCE',
      entityId: comp.token,
      details: `AI assistive analysis evaluated: Result=${aiResult.result || aiResult.status} (Confidence: ${aiResult.confidence}%, Distance: ${aiResult.distanceMeters || 0}m). Moved to Department Head Review.`
    });

    // Notify Department Head for Review
    this.notifications.unshift({
      id: `notif-dh-rev-${Date.now()}`,
      recipientRole: 'DEPARTMENT_ADMIN',
      recipientDepartmentId: comp.departmentId,
      title: `Resolution Evidence Ready for Review: ${comp.token}`,
      message: `Field officer has submitted resolution evidence for ${comp.title}. Please review AI comparison and provide recommendation for Admin final decision.`,
      type: 'WARNING',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/verification`
    });
    this.saveNotifications();

    return { complaint: comp, aiResult };
  }

  // Department Head reviews comparison & submits recommendation (Does NOT close the ticket)
  public submitDepartmentHeadRecommendation(ticketId: string, data: {
    recommendation: DepartmentHeadRecommendation;
    reason: string;
    instructions?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    comp.departmentHeadReviewStatus = 'RECOMMENDED';
    comp.departmentHeadRecommendation = data.recommendation;
    comp.departmentHeadReviewReason = data.reason;
    comp.departmentHeadReviewedBy = this.currentUser.id;
    comp.departmentHeadReviewedByName = this.currentUser.name;
    comp.departmentHeadReviewedAt = now;
    
    comp.evidenceStatus = 'ADMIN_REVIEW';
    comp.status = 'ADMIN_FINAL_REVIEW';
    comp.adminReviewStatus = 'PENDING';
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `Department Head Review Recommendation: [${data.recommendation}] - ${data.reason}`
    });

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: 'DEPARTMENT_ADMIN',
      action: 'DEPARTMENT_HEAD_RECOMMENDATION',
      entityType: 'COMPLAINT',
      entityId: comp.token,
      details: `Department Head ${this.currentUser.name} submitted recommendation: ${data.recommendation}. Forwarded to Main Admin for final decision.`
    });

    // Notify Main Admin
    this.notifications.unshift({
      id: `notif-admin-${Date.now()}`,
      recipientRole: 'ADMIN',
      title: `Admin Decision Required: ${comp.token}`,
      message: `Department Head recommended [${data.recommendation.replace(/_/g, ' ')}] for ${comp.title}. Final decision required.`,
      type: 'ALERT',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/admin`
    });
    this.saveNotifications();

    return comp;
  }

  // Main Admin makes the FINAL DECISION (Exclusive final authority)
  public submitAdminFinalDecision(ticketId: string, data: {
    decision: AdminDecisionType;
    reason: string;
    reassignDeptId?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    comp.adminDecision = data.decision;
    comp.adminDecisionReason = data.reason;
    comp.adminDecisionBy = this.currentUser.id;
    comp.adminDecisionByName = this.currentUser.name;
    comp.adminDecisionAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `Main Admin Executive Final Decision: [${data.decision}] - ${data.reason}`
    });

    if (data.decision === 'APPROVE_RESOLUTION') {
      comp.status = 'RESOLVED';
      comp.resolvedAt = now;
      comp.closedAt = now;
      comp.evidenceStatus = 'APPROVED';
      comp.adminReviewStatus = 'APPROVED';
      comp.citizenVerificationStatus = 'ACCEPTED';

      // Clear any triggers
      this.triggers = this.triggers.filter(t => t.ticketId !== comp.id);
      this.saveTriggers();

      // Citizen is notified ONLY after Admin approval
      this.notifications.unshift({
        id: `notif-cit-${Date.now()}`,
        recipientRole: 'CITIZEN',
        recipientId: comp.citizenId,
        title: `Complaint Successfully Verified & Resolved: ${comp.token}`,
        message: `Your complaint has been inspected, repaired, and approved by the Municipal Administration. Thank you for making our city better!`,
        type: 'SUCCESS',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/citizen/reports/${comp.id}`
      });

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'ADMIN',
        action: 'ADMIN_APPROVED',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Main Admin approved resolution evidence and officially closed complaint ${comp.token}. Reason: ${data.reason}`
      });

    } else if (data.decision === 'REJECT_RESOLUTION') {
      comp.status = 'RESOLUTION_REJECTED';
      comp.evidenceStatus = 'REJECTED';
      comp.adminReviewStatus = 'REJECTED';

      this.notifications.unshift({
        id: `notif-cit-rej-${Date.now()}`,
        recipientRole: 'CITIZEN',
        recipientId: comp.citizenId,
        title: `Resolution Evidence Rejected: ${comp.token}`,
        message: `The submitted remediation evidence did not meet municipal verification standards. Your complaint remains actively open and re-assigned for work.`,
        type: 'ALERT',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/citizen/reports/${comp.id}`
      });

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'ADMIN',
        action: 'ADMIN_REJECTED',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Main Admin rejected resolution for ${comp.token}. Reason: ${data.reason}`
      });

    } else if (data.decision === 'REQUEST_FIELD_INSPECTION') {
      comp.status = 'FIELD_INSPECTION_REQUIRED';
      comp.evidenceStatus = 'FIELD_INSPECTION_REQUIRED';
      comp.adminReviewStatus = 'INSPECTION_REQUESTED';

      this.createTriggerRecord({
        triggerType: 'AI_FLAG',
        ticketId: comp.id,
        ticketToken: comp.token,
        title: `Mandatory Physical Field Inspection: ${comp.title}`,
        area: comp.location.area,
        priority: 'HIGH',
        riskScore: 90,
        departmentName: comp.departmentName,
        actionRequired: `Executive Admin ordered senior physical inspection: ${data.reason}`
      });

      this.notifications.unshift({
        id: `notif-cit-insp-${Date.now()}`,
        recipientRole: 'CITIZEN',
        recipientId: comp.citizenId,
        title: `Field Inspection Ordered: ${comp.token}`,
        message: `Administration has ordered a mandatory on-site physical inspection to verify full remediation.`,
        type: 'INFO',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/citizen/reports/${comp.id}`
      });

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'ADMIN',
        action: 'ADMIN_REQUESTED_INSPECTION',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Main Admin ordered physical field inspection for ${comp.token}. Reason: ${data.reason}`
      });

    } else if (data.decision === 'REQUEST_MORE_EVIDENCE') {
      comp.status = 'ADDITIONAL_EVIDENCE_REQUIRED';
      comp.evidenceStatus = 'MORE_EVIDENCE_REQUIRED';
      comp.adminReviewStatus = 'MORE_EVIDENCE_REQUESTED';

      this.notifications.unshift({
        id: `notif-cit-more-${Date.now()}`,
        recipientRole: 'CITIZEN',
        recipientId: comp.citizenId,
        title: `Additional Evidence Requested: ${comp.token}`,
        message: `Administration has requested additional photographic and engineering evidence from the field department.`,
        type: 'INFO',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/citizen/reports/${comp.id}`
      });

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'ADMIN',
        action: 'ADMIN_REQUESTED_EVIDENCE',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Main Admin requested additional evidence for ${comp.token}. Reason: ${data.reason}`
      });

    } else if (data.decision === 'REASSIGN_DEPARTMENT' && data.reassignDeptId) {
      const newDept = this.departments.find(d => d.id === data.reassignDeptId);
      if (newDept) {
        const oldDept = comp.departmentName;
        comp.departmentId = newDept.id;
        comp.departmentName = newDept.name;
        comp.assignedOfficerId = undefined;
        comp.assignedOfficerName = undefined;
        comp.status = 'WAITING_FOR_DEPARTMENT';
        comp.adminReviewStatus = 'REASSIGNED';

        this.logAudit({
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          role: 'ADMIN',
          action: 'ADMIN_FINAL_REVIEW',
          entityType: 'DEPARTMENT',
          entityId: comp.token,
          details: `Main Admin rerouted ${comp.token} from ${oldDept} to ${newDept.name}. Reason: ${data.reason}`
        });
      }
    }

    comp.updatedAt = now;
    this.saveComplaints();
    this.saveNotifications();
    return comp;
  }

  // Alias for resolution evidence
  public async submitResolutionEvidence(ticketId: string, officerId: string, evidenceData: {
    imageUrl: string;
    latitude: number;
    longitude: number;
    locationName?: string;
    notes: string;
    simulatedQuality?: 'PERFECT' | 'GOOD' | 'UNCERTAIN' | 'MISMATCH';
  }): Promise<{ complaint: Complaint; aiResult: ImageComparisonResult } | undefined> {
    return this.uploadResolutionEvidence(ticketId, evidenceData);
  }

  // Update Status generic helper
  public updateStatus(ticketId: string, newStatus: ComplaintStatus, note?: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    comp.status = newStatus;
    comp.updatedAt = now;

    if (note) {
      if (!comp.officerNotes) comp.officerNotes = [];
      comp.officerNotes.push({
        timestamp: now,
        officerName: this.currentUser.name,
        note
      });
    }

    this.saveComplaints();
    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'STATUS_UPDATED',
      entityType: 'COMPLAINT',
      entityId: comp.token,
      details: `Status transitioned to ${newStatus}. ${note || ''}`
    });

    return comp;
  }

  // Citizen Final Verification Action
  public verifyAndResolveComplaint(ticketId: string, citizenId: string, approved: boolean, reason?: string): Complaint | undefined {
    return this.submitCitizenVerification(ticketId, {
      approved,
      reason,
      comment: reason
    });
  }

  // Citizen Final Verification Action
  public submitCitizenVerification(ticketId: string, verification: {
    approved: boolean;
    reason?: string;
    comment?: string;
    extraPhotoUrl?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const prevRejections = comp.citizenVerification?.rejectionCount || 0;

    if (verification.approved) {
      comp.status = 'RESOLVED';
      comp.resolvedAt = now;
      comp.closedAt = now;
      comp.citizenVerification = {
        status: 'ACCEPTED',
        verifiedAt: now,
        comment: verification.comment || 'Citizen confirmed satisfactory resolution.',
        rejectionCount: prevRejections
      };
      comp.updatedAt = now;

      // Close related trigger records
      this.triggers = this.triggers.filter(t => t.ticketId !== comp.id);
      this.saveTriggers();

      // Notifications
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientRole: 'CITIZEN',
        recipientId: comp.citizenId,
        title: `Complaint Successfully Resolved: ${comp.token}`,
        message: `Thank you for helping improve your neighborhood! Ticket has been closed.`,
        type: 'SUCCESS',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/citizen/reports/${comp.id}`
      });

      this.notifications.unshift({
        id: `notif-gov-${Date.now()}`,
        recipientRole: 'OFFICER',
        title: `Citizen Approved Resolution: ${comp.token}`,
        message: `Citizen verified repair for ${comp.title}. Ticket marked CLOSED.`,
        type: 'SUCCESS',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/government/complaints/${comp.id}`
      });
      this.saveNotifications();

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'CITIZEN',
        action: 'CITIZEN_VERIFIED_RESOLVED',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Citizen confirmed issue is resolved. Ticket ${comp.token} officially CLOSED.`
      });
    } else {
      const newRejectionCount = prevRejections + 1;
      comp.status = 'RESOLUTION_REJECTED';
      comp.citizenVerification = {
        status: 'REJECTED',
        verifiedAt: now,
        reason: verification.reason || 'Issue still persists or repair was ineffective.',
        comment: verification.comment,
        extraPhotoUrl: verification.extraPhotoUrl,
        rejectionCount: newRejectionCount
      };
      comp.updatedAt = now;

      // Check if dispute escalation threshold reached (>= 2 rejections)
      if (newRejectionCount >= 2) {
        comp.escalationLevel = 'LEVEL_2_ADMIN';
        comp.escalationReason = `Repeated citizen rejection (${newRejectionCount}x). Defective remediation reported.`;
        comp.escalatedAt = now;

        this.triggers.unshift({
          id: `trig-disp-${Date.now()}`,
          triggerType: 'CITIZEN_REJECTED',
          ticketId: comp.id,
          ticketToken: comp.token,
          title: `🚨 CITIZEN DISPUTE: ${comp.title} (${newRejectionCount}x Rejections)`,
          area: comp.location.area,
          reportCount: comp.relatedReportCount,
          daysUnresolved: Math.floor((Date.now() - new Date(comp.createdAt).getTime()) / (24 * 3600000)),
          priority: 'HIGH',
          riskScore: 88,
          departmentName: comp.departmentName,
          triggeredAt: now,
          status: 'ACTIVE',
          actionRequired: 'Senior Administrator intervention & third-party engineering inspection required'
        });
      } else {
        this.triggers.unshift({
          id: `trig-rej-${Date.now()}`,
          triggerType: 'CITIZEN_REJECTED',
          ticketId: comp.id,
          ticketToken: comp.token,
          title: `Resolution Rejected: ${comp.title}`,
          area: comp.location.area,
          reportCount: comp.relatedReportCount,
          daysUnresolved: 1,
          priority: comp.priority,
          riskScore: comp.riskScore,
          departmentName: comp.departmentName,
          triggeredAt: now,
          status: 'ACTIVE',
          actionRequired: `Citizen reported: ${verification.reason || 'Repair ineffective'}. Re-investigation required.`
        });
      }
      this.saveTriggers();

      this.notifications.unshift({
        id: `notif-gov-${Date.now()}`,
        recipientRole: 'OFFICER',
        title: `🚨 Citizen Rejected Resolution: ${comp.token}`,
        message: `Citizen stated: "${verification.reason || 'Issue still active'}". Case sent back for remediation.`,
        type: 'ALERT',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: now,
        read: false,
        actionUrl: `/government/complaints/${comp.id}`
      });
      this.saveNotifications();

      this.logAudit({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        role: 'CITIZEN',
        action: 'CITIZEN_REJECTED_RESOLUTION',
        entityType: 'COMPLAINT',
        entityId: comp.token,
        details: `Citizen rejected resolution for ${comp.token} (Attempt #${newRejectionCount}). Reason: ${verification.reason || 'Not fixed'}.`
      });
    }

    this.saveComplaints();
    return comp;
  }

  // Admin Escalate / Override
  public escalateComplaint(ticketId: string, level: EscalationLevel, reason: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    comp.escalationLevel = level;
    comp.escalationReason = reason;
    comp.escalatedAt = now;
    comp.updatedAt = now;

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'ADMIN_ESCALATION',
      entityType: 'ESCALATION',
      entityId: comp.token,
      details: `Escalated ${comp.token} to ${level}. Reason: ${reason}`
    });

    return comp;
  }

  // Admin Reassign Department
  public reassignDepartment(ticketId: string, newDeptId: string, reason: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const newDept = this.departments.find(d => d.id === newDeptId);
    if (!newDept) return undefined;

    const now = new Date().toISOString();
    const oldDeptName = comp.departmentName;
    comp.departmentId = newDept.id;
    comp.departmentName = newDept.name;
    comp.assignedOfficerId = undefined;
    comp.assignedOfficerName = undefined;
    comp.status = 'NEW';
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `Rerouted from ${oldDeptName} to ${newDept.name}. Reason: ${reason}`
    });

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'DEPARTMENT_REASSIGNED',
      entityType: 'DEPARTMENT',
      entityId: comp.token,
      details: `Reassigned ${comp.token} from ${oldDeptName} to ${newDept.name}. Reason: ${reason}`
    });

    return comp;
  }

  // Bridge & Convenience API Methods
  public async addComplaint(newComplaint: Complaint): Promise<Complaint> {
    this.complaints.unshift(newComplaint);
    this.saveComplaints();
    return newComplaint;
  }

  public updateComplaintStatus(id: string, status: ComplaintStatus, note?: string): Complaint | undefined {
    return this.updateStatus(id, status, note);
  }

  public updateComplaintDepartment(id: string, deptId: string, deptName: string): Complaint | undefined {
    return this.reassignDepartment(id, deptId, 'Manual officer department reassignment');
  }

  public async verifyAiResolution(id: string, aiResult: ImageComparisonResult): Promise<Complaint | undefined> {
    const comp = this.getComplaintById(id);
    if (!comp) return undefined;
    comp.aiVerification = aiResult;
    if (aiResult.status === 'MATCHED' || aiResult.status === 'LIKELY_MATCH') {
      comp.status = 'AWAITING_CITIZEN_VERIFICATION';
    }
    this.saveComplaints();
    return comp;
  }

  public async verifyCitizenResolution(id: string, accepted: boolean, feedback?: { reason?: string; comment?: string; extraPhotoUrl?: string }): Promise<Complaint | undefined> {
    return this.submitCitizenVerification(id, {
      approved: accepted,
      reason: feedback?.reason,
      comment: feedback?.comment,
      extraPhotoUrl: feedback?.extraPhotoUrl
    });
  }

  public createTriggerRecord(triggerData: Partial<TriggerRecord> & { triggerType: TriggerRecord['triggerType']; title: string; area: string; departmentName: string; actionRequired: string }): TriggerRecord {
    const newTrig: TriggerRecord = {
      id: `trig-${Date.now()}`,
      triggerType: triggerData.triggerType,
      ticketId: triggerData.ticketId || '',
      ticketToken: triggerData.ticketToken || '',
      title: triggerData.title,
      area: triggerData.area,
      reportCount: triggerData.reportCount || 1,
      daysUnresolved: triggerData.daysUnresolved || 0,
      priority: triggerData.priority || 'HIGH',
      riskScore: triggerData.riskScore || 85,
      departmentName: triggerData.departmentName,
      triggeredAt: new Date().toISOString(),
      status: triggerData.status || 'ACTIVE',
      actionRequired: triggerData.actionRequired
    };
    this.triggers.unshift(newTrig);
    this.saveTriggers();
    return newTrig;
  }

  public logAuditAction(audit: Partial<AuditLogItem> & { userId: string; userName: string; role: any; action: string; entityType: any; entityId: string; details: string }) {
    this.logAudit({
      userId: audit.userId,
      userName: audit.userName,
      role: audit.role,
      action: audit.action,
      entityType: audit.entityType,
      entityId: audit.entityId,
      details: audit.details,
      metadata: audit.metadata
    });
  }

  // SLA Expedite / Urgency Reminder to Assigned Officer & Gang
  public sendSlaExpediteReminder(ticketId: string, customMessage?: string): { success: boolean; message: string } {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return { success: false, message: 'Ticket not found' };

    const now = new Date().toISOString();
    const msg = customMessage || `CRITICAL SLA NOTICE: Ticket ${comp.token} (${comp.title}) is approaching resolution breach window. Immediate field crew response required.`;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `⚡ [SLA EXPEDITE NOTICE ISSUED] ${msg}`
    });

    this.notifications.unshift({
      id: `notif-sla-${Date.now()}`,
      recipientRole: 'OFFICER',
      recipientId: comp.assignedOfficerId,
      title: `⚡ URGENT SLA EXPEDITE: ${comp.token}`,
      message: msg,
      type: 'ALERT',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });

    this.saveNotifications();
    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'SLA_EXPEDITE_ISSUED',
      entityType: 'SLA',
      entityId: comp.token,
      details: `Officer dispatch notification sent for ${comp.token}. Reason: SLA Approaching Breach.`
    });

    return { success: true, message: `High-priority dispatch alert transmitted to ${comp.assignedOfficerName || 'Field Division'}` };
  }

  // Extend SLA with formal justification
  public extendSlaDeadline(ticketId: string, additionalHours: number, justification: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const currentDeadlineMs = new Date(comp.slaDeadline).getTime() || Date.now();
    const newDeadlineMs = currentDeadlineMs + additionalHours * 3600 * 1000;
    const newDeadline = new Date(newDeadlineMs).toISOString();

    const prevSlaHours = comp.slaHours || 24;
    comp.slaHours = prevSlaHours + additionalHours;
    comp.slaDeadline = newDeadline;
    comp.slaStatus = 'ON_TRACK';
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: this.currentUser.name,
      note: `⏱️ [SLA WINDOW EXTENDED +${additionalHours}h] New Deadline: ${new Date(newDeadline).toLocaleString()}. Justification: ${justification}`
    });

    this.saveComplaints();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'SLA_DEADLINE_EXTENDED',
      entityType: 'SLA',
      entityId: comp.token,
      details: `Extended SLA by ${additionalHours} hours for ${comp.token}. Reason: ${justification}`
    });

    return comp;
  }

  // Duplicate Detection & Semantic Proximity Search
  public searchDuplicates(lat: number, lng: number, category: CivicCategory, queryText: string = ''): {
    matches: Array<{ complaint: Complaint; distanceMeters: number; similarityPercent: number }>;
    existingCluster?: IssueCluster;
  } {
    const matches: Array<{ complaint: Complaint; distanceMeters: number; similarityPercent: number }> = [];

    this.complaints.forEach((comp) => {
      if (comp.status === 'RESOLVED' || comp.status === 'CLOSED') return;
      if (comp.category !== category) return;

      const dist = this.calculateDistanceMeters(lat, lng, comp.location.latitude, comp.location.longitude);
      
      // If within 1.5 km and same category
      if (dist <= 1500) {
        // Calculate semantic similarity score based on text and proximity
        let similarity = 60;
        if (dist <= 150) similarity += 30;
        else if (dist <= 500) similarity += 20;
        else if (dist <= 1000) similarity += 10;

        const lowerQuery = queryText.toLowerCase();
        const lowerTitle = comp.title.toLowerCase();
        const lowerSubcat = comp.subcategory.toLowerCase();

        if (lowerQuery.includes('pothole') && lowerTitle.includes('pothole')) similarity += 10;
        if (lowerQuery.includes('wire') && lowerTitle.includes('wire')) similarity += 10;
        if (lowerQuery.includes('water') && lowerTitle.includes('water')) similarity += 10;
        if (lowerQuery.includes('garbage') && lowerTitle.includes('garbage')) similarity += 10;

        const cappedSimilarity = Math.min(similarity, 96);
        matches.push({
          complaint: comp,
          distanceMeters: Math.round(dist),
          similarityPercent: cappedSimilarity
        });
      }
    });

    // Sort by proximity & similarity
    matches.sort((a, b) => b.similarityPercent - a.similarityPercent || a.distanceMeters - b.distanceMeters);

    // Look for matching cluster nearby
    const existingCluster = this.clusters.find(cl => {
      if (cl.category !== category) return false;
      const d = this.calculateDistanceMeters(lat, lng, cl.latitude, cl.longitude);
      return d <= 800;
    });

    return {
      matches: matches.slice(0, 5),
      existingCluster
    };
  }

  // --- QA / Developer Simulator Controls ---
  /**
   * Force SLA Breach scenario on target complaints:
   * Sets slaDeadline to past (e.g. 4 hours ago) and updates SLA status to OVERDUE.
   */
  public simulateSlaBreachScenario(count: number = 3, specificTicketIds?: string[]): {
    affectedTokens: string[];
    count: number;
  } {
    const nowMs = Date.now();
    const fourHoursAgo = new Date(nowMs - 4.5 * 3600 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(nowMs - 52 * 3600 * 1000).toISOString();

    const affectedTokens: string[] = [];
    let updatedCount = 0;

    this.complaints.forEach((comp) => {
      // If specific IDs given
      if (specificTicketIds && specificTicketIds.length > 0) {
        if (!specificTicketIds.includes(comp.id) && !specificTicketIds.includes(comp.token)) {
          return;
        }
      } else {
        // Otherwise pick active, non-resolved complaints up to count
        if (comp.status === 'RESOLVED' || comp.status === 'CLOSED') return;
        if (updatedCount >= count) return;
      }

      comp.slaCreatedAt = fortyEightHoursAgo;
      comp.slaDeadline = fourHoursAgo;
      comp.slaStatus = 'OVERDUE';
      comp.updatedAt = new Date().toISOString();

      if (!comp.officerNotes) comp.officerNotes = [];
      comp.officerNotes.push({
        timestamp: new Date().toISOString(),
        officerName: 'QA / DEV SIMULATOR',
        note: '⚠️ [SIMULATED BREACH TRIGGERED] Forcing past deadline to test alert workflows & supervisor triggers.'
      });

      affectedTokens.push(comp.token);
      updatedCount++;

      // Trigger automatic high priority alert notification
      this.notifications.unshift({
        id: `notif-breach-sim-${Date.now()}-${updatedCount}`,
        recipientRole: 'OFFICER',
        recipientId: comp.assignedOfficerId,
        title: `🚨 QA SIMULATION: SLA BREACH on ${comp.token}`,
        message: `Simulated SLA Breach event triggered for "${comp.title}". Immediate dispatch & escalation required.`,
        type: 'ALERT',
        ticketId: comp.id,
        ticketToken: comp.token,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: `/government/complaints/${comp.id}`
      });
    });

    this.saveComplaints();
    this.saveNotifications();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'QA_SLA_BREACH_SIMULATED',
      entityType: 'SLA',
      entityId: affectedTokens.join(', '),
      details: `Developer QA Simulation: Forced past deadlines on ${updatedCount} grievances (${affectedTokens.join(', ')}).`
    });

    return {
      affectedTokens,
      count: updatedCount
    };
  }

  /**
   * Force Approaching Breach (< 4 hours) scenario on target complaints:
   */
  public simulateApproachingBreachScenario(count: number = 2): {
    affectedTokens: string[];
    count: number;
  } {
    const nowMs = Date.now();
    const inTwoHours = new Date(nowMs + 2 * 3600 * 1000).toISOString();
    const twentyTwoHoursAgo = new Date(nowMs - 22 * 3600 * 1000).toISOString();

    const affectedTokens: string[] = [];
    let updatedCount = 0;

    this.complaints.forEach((comp) => {
      if (comp.status === 'RESOLVED' || comp.status === 'CLOSED') return;
      if (updatedCount >= count) return;

      comp.slaCreatedAt = twentyTwoHoursAgo;
      comp.slaDeadline = inTwoHours;
      comp.slaHours = 24;
      comp.slaStatus = 'DUE_SOON';
      comp.updatedAt = new Date().toISOString();

      affectedTokens.push(comp.token);
      updatedCount++;
    });

    this.saveComplaints();
    this.saveNotifications();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'QA_SLA_APPROACHING_SIMULATED',
      entityType: 'SLA',
      entityId: affectedTokens.join(', '),
      details: `Developer QA Simulation: Forced near-breach deadline (<2h) on ${updatedCount} grievances.`
    });

    return { affectedTokens, count: updatedCount };
  }

  /**
   * Reset all SLAs to healthy deadlines (+24 hours from now)
   */
  public resetAllSlaTimersToHealthy(): { count: number } {
    const nowMs = Date.now();
    const inTwentyFourHours = new Date(nowMs + 24 * 3600 * 1000).toISOString();
    let count = 0;

    this.complaints.forEach((comp) => {
      if (comp.status !== 'RESOLVED' && comp.status !== 'CLOSED') {
        comp.slaCreatedAt = new Date(nowMs - 2 * 3600 * 1000).toISOString();
        comp.slaDeadline = inTwentyFourHours;
        comp.slaStatus = 'ON_TRACK';
        comp.escalationLevel = 'NONE';
        count++;
      }
    });

    this.saveComplaints();
    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'QA_SLA_RESET_HEALTHY',
      entityType: 'SLA',
      entityId: 'ALL_ACTIVE',
      details: `Developer QA Simulation: Restored all active grievances to healthy SLA (+24h).`
    });

    return { count };
  }

  /**
   * Extend the SLA deadline window for a grievance
   */
  public extendSlaWindow(ticketId: string, additionalHours: number, reason: string): { success: boolean; message: string; newDeadline?: string } {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return { success: false, message: 'Ticket not found.' };

    const currentDeadlineMs = new Date(comp.slaDeadline).getTime();
    const newDeadlineMs = currentDeadlineMs + additionalHours * 3600 * 1000;
    comp.slaDeadline = new Date(newDeadlineMs).toISOString();
    comp.slaHours = (comp.slaHours || 24) + additionalHours;
    comp.slaStatus = 'ON_TRACK';
    comp.updatedAt = new Date().toISOString();

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: new Date().toISOString(),
      officerName: this.currentUser.name,
      note: `⏱️ Authorized SLA Window Extension (+${additionalHours}h). Reason: ${reason}`
    });

    this.notifications.unshift({
      id: `notif-sla-ext-${Date.now()}`,
      recipientRole: 'SUPERVISOR',
      title: `SLA Window Extended: ${comp.token}`,
      message: `${this.currentUser.name} extended SLA by +${additionalHours}h on "${comp.title}". Justification: ${reason}`,
      type: 'INFO',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });

    this.saveComplaints();
    this.saveNotifications();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: this.currentUser.role,
      action: 'SLA_WINDOW_EXTENDED',
      entityType: 'SLA',
      entityId: comp.token,
      details: `Extended SLA window by +${additionalHours}h. Reason: ${reason}`
    });

    return {
      success: true,
      message: `SLA extended by +${additionalHours} hours. Target: ${new Date(newDeadlineMs).toLocaleString()}`,
      newDeadline: comp.slaDeadline
    };
  }

  // --- Automated SLA Breach Watchdog & Executive Alert Service ---
  /**
   * Automated SLA Watchdog:
   * Scans active grievances and automatically fires high-priority alerts to the
   * Department Supervisor and the Government Admin (Main Head) whenever an SLA threshold is breached.
   */
  public checkAndTriggerSlaBreaches(): { breachedCount: number; newlyNotifiedTokens: string[] } {
    const nowMs = Date.now();
    let breachedCount = 0;
    const newlyNotifiedTokens: string[] = [];
    let stateChanged = false;

    this.complaints.forEach((comp) => {
      if (comp.status === 'RESOLVED' || comp.status === 'CLOSED' || comp.status === 'REJECTED') {
        return;
      }

      const deadlineMs = new Date(comp.slaDeadline).getTime();
      const createdAtMs = new Date(comp.createdAt).getTime();
      const daysOpen = Math.floor((nowMs - createdAtMs) / (24 * 3600 * 1000));
      comp.prolongedDays = daysOpen;

      // Check if SLA has exceeded
      if (nowMs > deadlineMs) {
        breachedCount++;
        const hoursOverdue = Math.max(1, Math.round((nowMs - deadlineMs) / (3600 * 1000)));
        const wasAlreadyOverdue = comp.slaStatus === 'OVERDUE';
        
        if (!wasAlreadyOverdue) {
          comp.slaStatus = 'OVERDUE';
          comp.updatedAt = new Date().toISOString();
          stateChanged = true;
        }

        // Check if we have already sent the automated breach alert for this ticket
        const existingBreachAlert = this.notifications.find(
          n => (n.ticketId === comp.id || n.ticketToken === comp.token) && n.title.includes('SLA BREACH')
        );

        if (!existingBreachAlert) {
          newlyNotifiedTokens.push(comp.token);
          stateChanged = true;

          // 1. Alert Department Supervisor
          this.notifications.unshift({
            id: `notif-sla-sup-${Date.now()}-${comp.id}`,
            recipientRole: 'SUPERVISOR',
            title: `🚨 SLA BREACH: ${comp.token} (${comp.departmentName})`,
            message: `Grievance "${comp.title}" has exceeded SLA resolution deadline by ${hoursOverdue}h. Immediate supervisor intervention required.`,
            type: 'ALERT',
            ticketId: comp.id,
            ticketToken: comp.token,
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/government/complaints/${comp.id}`
          });

          // 2. Alert Government Admin (Main Head / Commissioner)
          this.notifications.unshift({
            id: `notif-sla-adm-${Date.now()}-${comp.id}`,
            recipientRole: 'ADMIN',
            recipientId: 'gov-admin',
            title: `🚨 EXECUTIVE SLA BREACH: ${comp.token}`,
            message: `Department ${comp.departmentName} has breached SLA timeline on "${comp.title}". Overdue by ${hoursOverdue}h. Prolonged escalation recorded.`,
            type: 'ALERT',
            ticketId: comp.id,
            ticketToken: comp.token,
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/government/complaints/${comp.id}`
          });

          // 3. Alert Assigned Officer
          if (comp.assignedOfficerId) {
            this.notifications.unshift({
              id: `notif-sla-off-${Date.now()}-${comp.id}`,
              recipientRole: 'OFFICER',
              recipientId: comp.assignedOfficerId,
              title: `⚠️ SLA OVERDUE: ${comp.token}`,
              message: `Your assigned task "${comp.title}" has passed its SLA target. Update status or request extension.`,
              type: 'ALERT',
              ticketId: comp.id,
              ticketToken: comp.token,
              timestamp: new Date().toISOString(),
              read: false,
              actionUrl: `/government/complaints/${comp.id}`
            });
          }

          // 4. Update or Add Trigger Record
          const existingTrigger = this.triggers.find(t => t.ticketId === comp.id && t.triggerType === 'SLA_BREACH');
          if (!existingTrigger) {
            this.triggers.unshift({
              id: `trig-sla-${Date.now()}-${comp.id}`,
              triggerType: 'SLA_BREACH',
              ticketId: comp.id,
              ticketToken: comp.token,
              title: `SLA Breach (${hoursOverdue}h Overdue): ${comp.title}`,
              area: comp.location.area,
              reportCount: comp.relatedReportCount,
              daysUnresolved: daysOpen,
              priority: 'CRITICAL',
              riskScore: Math.min(100, comp.riskScore + 20),
              departmentName: comp.departmentName,
              triggeredAt: new Date().toISOString(),
              status: 'ACTIVE',
              actionRequired: `Department Supervisor & Municipal Admin Head alerted. Expedited deployment required.`
            });
          }

          // 5. Immutable Audit Log
          this.logAudit({
            userId: 'system-watchdog',
            userName: 'Automated SLA Watchdog Engine',
            role: 'ADMIN',
            action: 'SLA_BREACH_AUTOMATED_TRIGGER',
            entityType: 'SLA',
            entityId: comp.token,
            details: `Automated Engine detected SLA breach on ${comp.token} (+${hoursOverdue}h overdue). Dispatched high-priority alerts to Department Supervisor and Municipal Admin Head.`
          });
        }
      } else if (deadlineMs - nowMs < 4 * 3600 * 1000 && comp.slaStatus === 'ON_TRACK') {
        // Due soon (< 4h)
        comp.slaStatus = 'DUE_SOON';
        stateChanged = true;
      }
    });

    if (stateChanged) {
      this.saveComplaints();
      this.saveNotifications();
      this.saveTriggers();
    }

    return { breachedCount, newlyNotifiedTokens };
  }

  /**
   * Citizen Escalation to Government Admin (Main Head / Commissioner):
   * Allows a citizen whose grievance has been prolonged or unresolved after particular days
   * to escalate directly to the Municipal Chief Administrator for executive action.
   */
  public escalateToMainHeadByCitizen(ticketId: string, reason: string): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const daysOpen = Math.floor((Date.now() - new Date(comp.createdAt).getTime()) / (24 * 3600 * 1000));

    comp.escalatedToMainHead = true;
    comp.escalatedByCitizenAt = now;
    comp.citizenEscalationReason = reason;
    comp.escalationLevel = 'LEVEL_3_EXECUTIVE';
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: 'CITIZEN ESCALATION PROTOCOL',
      note: `🚨 Citizen escalated directly to Municipal Chief Administrator (Main Head). Stated: "${reason}". Days open: ${daysOpen}d.`
    });

    // Alert Government Admin (Main Head)
    this.notifications.unshift({
      id: `notif-esc-mainhead-${Date.now()}`,
      recipientRole: 'ADMIN',
      recipientId: 'gov-admin',
      title: `👑 CITIZEN ESCALATION TO MAIN HEAD: ${comp.token}`,
      message: `Citizen ${comp.citizenName} has escalated prolonged grievance "${comp.title}" (${comp.departmentName}, ${daysOpen}d unresolved) directly to you for executive intervention. Reason: ${reason}`,
      type: 'ALERT',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });

    // Notify Citizen of successful escalation submission
    this.notifications.unshift({
      id: `notif-cit-esc-${Date.now()}`,
      recipientRole: 'CITIZEN',
      recipientId: comp.citizenId,
      title: `Escalated to Municipal Chief Administrator: ${comp.token}`,
      message: `Your grievance has been submitted directly to the State Civic Administration Head (K. Rajasekaran, IAS) for executive oversight and priority mandate.`,
      type: 'INFO',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/citizen/reports/${comp.id}`
    });

    // Alert Department Supervisor
    this.notifications.unshift({
      id: `notif-sup-esc-${Date.now()}`,
      recipientRole: 'SUPERVISOR',
      title: `🚨 CITIZEN ESCALATED CASE TO COMMISSIONER: ${comp.token}`,
      message: `Citizen escalated ${comp.token} to Main Head due to prolonged delay. Department inquiry pending.`,
      type: 'ALERT',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });

    // Trigger record
    this.triggers.unshift({
      id: `trig-mainhead-${Date.now()}`,
      triggerType: 'LONG_UNRESOLVED',
      ticketId: comp.id,
      ticketToken: comp.token,
      title: `👑 Citizen Escalated to Main Head: ${comp.title}`,
      area: comp.location.area,
      reportCount: comp.relatedReportCount,
      daysUnresolved: daysOpen,
      priority: 'CRITICAL',
      riskScore: 98,
      departmentName: comp.departmentName,
      triggeredAt: now,
      status: 'ACTIVE',
      actionRequired: `Executive Action from Municipal Chief Administrator required: ${reason}`
    });

    this.saveComplaints();
    this.saveNotifications();
    this.saveTriggers();

    this.logAudit({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      role: 'CITIZEN',
      action: 'CITIZEN_ESCALATED_TO_MAIN_HEAD',
      entityType: 'ESCALATION',
      entityId: comp.token,
      details: `Citizen escalated prolonged grievance ${comp.token} directly to Municipal Chief Administrator. Reason: ${reason}`
    });

    return comp;
  }

  /**
   * Executive Action on Prolonged Grievance taken by Government Admin (Main Head):
   */
  public adminExecuteActionOnProlongedComplaint(ticketId: string, actionData: {
    actionType: 'DIRECT_OVERRIDE_SANCTION' | 'DEPARTMENT_INQUEST' | 'INTER_DEPT_REROUTE' | 'RAPID_DISPATCH';
    note: string;
    sanctionDetails?: string;
    reassignDeptId?: string;
  }): Complaint | undefined {
    const comp = this.getComplaintById(ticketId);
    if (!comp) return undefined;

    const now = new Date().toISOString();
    const adminUser = this.currentUser.role === 'ADMIN' ? this.currentUser : (DEMO_USERS.find(u => u.role === 'ADMIN') || this.currentUser);

    comp.adminActionTaken = {
      actionType: actionData.actionType,
      note: actionData.note,
      actionDate: now,
      adminName: adminUser.name,
      sanctionDetails: actionData.sanctionDetails
    };
    comp.priority = 'CRITICAL';
    comp.riskScore = 99;
    comp.updatedAt = now;

    if (!comp.officerNotes) comp.officerNotes = [];
    comp.officerNotes.push({
      timestamp: now,
      officerName: `👑 EXECUTIVE ORDER: ${adminUser.name}`,
      note: `[${actionData.actionType}] ${actionData.note}. ${actionData.sanctionDetails || ''}`
    });

    if (actionData.actionType === 'INTER_DEPT_REROUTE' && actionData.reassignDeptId) {
      const targetDept = this.departments.find(d => d.id === actionData.reassignDeptId);
      if (targetDept) {
        comp.departmentId = targetDept.id;
        comp.departmentName = targetDept.name;
        comp.assignedOfficerId = undefined;
        comp.assignedOfficerName = undefined;
      }
    }

    // Extended SLA + 24 hours under executive mandate
    comp.slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    comp.slaStatus = 'ON_TRACK';

    // Notify Citizen
    this.notifications.unshift({
      id: `notif-cit-adm-action-${Date.now()}`,
      recipientRole: 'CITIZEN',
      recipientId: comp.citizenId,
      title: `⚡ Executive Order Issued: ${comp.token}`,
      message: `Municipal Chief Administrator (${adminUser.name}) personally reviewed your escalated case and issued executive orders: "${actionData.note}". Special task crew mobilized.`,
      type: 'SUCCESS',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/citizen/reports/${comp.id}`
    });

    // Notify Department Head & Supervisor
    this.notifications.unshift({
      id: `notif-dept-adm-mandate-${Date.now()}`,
      recipientRole: 'SUPERVISOR',
      title: `⚡ EXECUTIVE ACTION MANDATE: ${comp.token}`,
      message: `Municipal Commissioner issued executive mandate on ${comp.token}: ${actionData.note}. 24-hour resolution deadline enforced.`,
      type: 'ALERT',
      ticketId: comp.id,
      ticketToken: comp.token,
      timestamp: now,
      read: false,
      actionUrl: `/government/complaints/${comp.id}`
    });

    this.saveComplaints();
    this.saveNotifications();

    this.logAudit({
      userId: adminUser.id,
      userName: adminUser.name,
      role: 'ADMIN',
      action: 'ADMIN_EXECUTIVE_ACTION_EXECUTED',
      entityType: 'ESCALATION',
      entityId: comp.token,
      details: `Municipal Chief Administrator executed ${actionData.actionType} on ${comp.token}. Directive: ${actionData.note}`
    });

    return comp;
  }

  // Haversine formula distance calculation in meters
  public calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // --- Getters for Other Entities ---
  public getDepartments(): Department[] {
    return this.departments;
  }

  public getOfficers(): Officer[] {
    return this.officers;
  }

  public getClusters(): IssueCluster[] {
    return this.clusters;
  }

  public getTriggers(): TriggerRecord[] {
    return this.triggers;
  }

  public getNotifications(role?: string, citizenId?: string): AppNotification[] {
    return this.notifications.filter(n => {
      if (n.recipientRole === 'ALL') return true;
      if (role === 'ADMIN') {
        // Main Head Admin sees all administrative, supervisor, and officer alerts
        return true;
      }
      if (role === 'SUPERVISOR') {
        return n.recipientRole === 'SUPERVISOR' || n.recipientRole === 'DEPARTMENT_ADMIN' || n.recipientRole === 'OFFICER';
      }
      if (role && n.recipientRole === role) {
        if (citizenId && n.recipientId) {
          return n.recipientId === citizenId;
        }
        return true;
      }
      if (citizenId && n.recipientId === citizenId) {
        return true;
      }
      return false;
    });
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs;
  }

  public getAuditLogsForComplaint(ticketIdOrToken: string): AuditLogItem[] {
    const comp = this.getComplaintById(ticketIdOrToken);
    const token = comp?.token || ticketIdOrToken;
    const compId = comp?.id || ticketIdOrToken;

    const matched = this.auditLogs.filter(
      log => log.entityId === token || log.entityId === compId || log.details.includes(token) || (log.metadata?.ticketId === compId)
    );

    if (matched.length > 0) {
      return matched.map(m => ({
        ...m,
        performedBy: m.performedBy || m.userName,
        performedByRole: m.performedByRole || m.role
      }));
    }

    // If no explicit logs found in store (e.g. initial demo complaint before actions), generate synthetic timeline
    if (comp) {
      const syntheticLogs: AuditLogItem[] = [
        {
          id: `aud-init-${comp.id}-1`,
          timestamp: comp.createdAt,
          userId: comp.citizenId,
          userName: comp.citizenName,
          role: 'CITIZEN',
          performedBy: comp.citizenName,
          performedByRole: 'CITIZEN',
          action: 'COMPLAINT_REGISTERED',
          entityType: 'COMPLAINT',
          entityId: comp.token,
          details: `Grievance registered via SEVA AI Voice Agent (${comp.language || 'Voice'}). Categorized as ${comp.category} - ${comp.subcategory}.`
        }
      ];

      if (comp.assignedAt && comp.assignedOfficerName) {
        syntheticLogs.push({
          id: `aud-init-${comp.id}-2`,
          timestamp: comp.assignedAt,
          userId: comp.assignedOfficerId || 'gov-officer',
          userName: comp.assignedOfficerName,
          role: 'OFFICER',
          performedBy: comp.assignedOfficerName,
          performedByRole: 'OFFICER',
          action: 'OFFICER_ASSIGNED',
          entityType: 'OFFICER',
          entityId: comp.token,
          details: `Assigned to field specialist ${comp.assignedOfficerName} (${comp.departmentName}).`
        });
      }

      if (comp.workStartedAt) {
        syntheticLogs.push({
          id: `aud-init-${comp.id}-3`,
          timestamp: comp.workStartedAt,
          userId: comp.assignedOfficerId || 'gov-officer',
          userName: comp.assignedOfficerName || 'Field Division',
          role: 'OFFICER',
          performedBy: comp.assignedOfficerName || 'Field Division',
          performedByRole: 'OFFICER',
          action: 'WORK_COMMENCED',
          entityType: 'COMPLAINT',
          entityId: comp.token,
          details: `Field work gang deployed to site location at ${comp.location.address}.`
        });
      }

      if (comp.governmentEvidence) {
        syntheticLogs.push({
          id: `aud-init-${comp.id}-4`,
          timestamp: comp.governmentEvidence.capturedAt,
          userId: comp.governmentEvidence.uploadedBy,
          userName: comp.governmentEvidence.uploaderName,
          role: comp.governmentEvidence.uploaderRole,
          performedBy: comp.governmentEvidence.uploaderName,
          performedByRole: comp.governmentEvidence.uploaderRole,
          action: 'RESOLUTION_EVIDENCE_SUBMITTED',
          entityType: 'EVIDENCE',
          entityId: comp.token,
          details: `Field officer uploaded site repair completion photo. Verified via GPS metadata.`
        });
      }

      if (comp.citizenVerification?.status === 'ACCEPTED') {
        syntheticLogs.push({
          id: `aud-init-${comp.id}-5`,
          timestamp: comp.citizenVerification.verifiedAt || comp.resolvedAt || new Date().toISOString(),
          userId: comp.citizenId,
          userName: comp.citizenName,
          role: 'CITIZEN',
          performedBy: comp.citizenName,
          performedByRole: 'CITIZEN',
          action: 'CITIZEN_VERIFIED_RESOLVED',
          entityType: 'COMPLAINT',
          entityId: comp.token,
          details: `Reporting citizen reviewed and approved resolution proof. Grievance closed.`
        });
      } else if (comp.citizenVerification?.status === 'REJECTED') {
        syntheticLogs.push({
          id: `aud-init-${comp.id}-5`,
          timestamp: comp.citizenVerification.verifiedAt || new Date().toISOString(),
          userId: comp.citizenId,
          userName: comp.citizenName,
          role: 'CITIZEN',
          performedBy: comp.citizenName,
          performedByRole: 'CITIZEN',
          action: 'CITIZEN_CONTESTED_RESOLUTION',
          entityType: 'COMPLAINT',
          entityId: comp.token,
          details: `Citizen contested remediation proof: "${comp.citizenVerification.reason || 'Issue persists'}".`
        });
      }

      return syntheticLogs;
    }

    return [];
  }

  public logAudit(log: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    const newLog: AuditLogItem = {
      ...log,
      performedBy: log.performedBy || log.userName,
      performedByRole: log.performedByRole || log.role,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    this.saveAuditLogs();
  }

  // Reset demo store
  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
    localStorage.removeItem(STORAGE_KEYS.TRIGGERS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.complaints = generateSeedComplaints();
    this.triggers = TRIGGER_RECORDS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.saveComplaints();
    this.saveTriggers();
    this.saveNotifications();
    this.saveAuditLogs();
  }
}

export const sevaStore = new SevaDataStore();
