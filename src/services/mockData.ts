import { 
  Department, 
  Officer, 
  Complaint, 
  IssueCluster, 
  TriggerRecord, 
  AppNotification, 
  AuditLogItem,
  UserProfile
} from '../types';

import { 
  MAIN_ADMIN_USER, 
  SEVA_18_DEPARTMENTS, 
  DEPARTMENT_ADMIN_USERS, 
  DEPARTMENT_OFFICERS, 
  DEMO_CITIZEN_USERS 
} from './organizationData';

export const DEMO_USERS: UserProfile[] = [
  MAIN_ADMIN_USER,
  ...DEMO_CITIZEN_USERS,
  ...DEPARTMENT_ADMIN_USERS,
  ...DEPARTMENT_OFFICERS.map(off => ({
    id: off.id,
    name: off.name,
    email: off.email,
    phone: off.phone,
    role: off.role,
    departmentId: off.departmentId,
    departmentName: off.departmentName,
    badgeNumber: off.badge,
    avatarUrl: off.avatar
  }))
];

export const DEPARTMENTS: Department[] = SEVA_18_DEPARTMENTS;

export const OFFICERS: Officer[] = DEPARTMENT_OFFICERS;


export const ISSUE_CLUSTERS: IssueCluster[] = [
  {
    id: 'cl-001',
    clusterCode: 'CL-2026-0012',
    title: 'Severe Crater Pothole Cluster on Madipakkam Main Road',
    category: 'ROAD',
    subcategory: 'POTHOLE',
    area: 'Madipakkam, Chennai',
    latitude: 12.9647,
    longitude: 80.1961,
    reportCount: 18,
    riskLevel: 'HIGH',
    riskScore: 84,
    status: 'ACTIVE',
    departmentName: 'Municipal Corporation (Roads & Works)',
    firstReportedAt: '2026-08-03T09:14:00Z',
    latestReportedAt: '2026-08-15T16:30:00Z',
    complaintTokens: ['ROAD-2026-000123', 'ROAD-2026-000124', 'ROAD-2026-000135']
  },
  {
    id: 'cl-002',
    clusterCode: 'CL-2026-0019',
    title: 'Contaminated Water & Pressure Drop near Velachery Bypass',
    category: 'WATER',
    subcategory: 'CONTAMINATION',
    area: 'Velachery, Chennai',
    latitude: 12.9785,
    longitude: 80.2217,
    reportCount: 14,
    riskLevel: 'HIGH',
    riskScore: 78,
    status: 'INVESTIGATING',
    departmentName: 'Water Supply & Sewerage Board',
    firstReportedAt: '2026-08-09T08:00:00Z',
    latestReportedAt: '2026-08-15T14:10:00Z',
    complaintTokens: ['WTR-2026-000088', 'WTR-2026-000091']
  },
  {
    id: 'cl-003',
    clusterCode: 'CL-2026-0025',
    title: 'Fallen High-Tension Sparking Wire near Tambaram Bus Terminus',
    category: 'ELECTRICITY',
    subcategory: 'FALLEN_WIRE',
    area: 'Tambaram, Chennai',
    latitude: 12.9249,
    longitude: 80.1248,
    reportCount: 9,
    riskLevel: 'CRITICAL',
    riskScore: 96,
    status: 'ACTIVE',
    departmentName: 'Electricity Distribution Corp',
    firstReportedAt: '2026-08-15T17:40:00Z',
    latestReportedAt: '2026-08-15T19:20:00Z',
    complaintTokens: ['ELEC-2026-000041', 'ELEC-2026-000042']
  },
  {
    id: 'cl-004',
    clusterCode: 'CL-2026-0031',
    title: 'Overflowing Commercial Dumpyard Waste on Adyar Canal Bank',
    category: 'GARBAGE',
    subcategory: 'OVERFLOW',
    area: 'Adyar, Chennai',
    latitude: 13.0012,
    longitude: 80.2565,
    reportCount: 11,
    riskLevel: 'MEDIUM',
    riskScore: 58,
    status: 'INVESTIGATING',
    departmentName: 'Solid Waste Management',
    firstReportedAt: '2026-08-12T11:20:00Z',
    latestReportedAt: '2026-08-15T11:45:00Z',
    complaintTokens: ['GARB-2026-000104']
  },
  {
    id: 'cl-005',
    clusterCode: 'CL-2026-0038',
    title: 'Broken Traffic Light Synchronizer at Guindy Kathipara Junction',
    category: 'TRANSPORT',
    subcategory: 'TRAFFIC_SIGNAL',
    area: 'Guindy, Chennai',
    latitude: 13.0067,
    longitude: 80.2012,
    reportCount: 7,
    riskLevel: 'HIGH',
    riskScore: 74,
    status: 'ACTIVE',
    departmentName: 'Metropolitan Transport',
    firstReportedAt: '2026-08-14T07:15:00Z',
    latestReportedAt: '2026-08-15T18:05:00Z',
    complaintTokens: ['TRANS-2026-000052']
  }
];

// Rich seed complaints (100 total generated programmatically with realistic details)
export function generateSeedComplaints(): Complaint[] {
  const nowMs = Date.now();
  const H = 3600000;

  const baseList: Complaint[] = [
    {
      id: 'cmp-001',
      token: 'ROAD-2026-000123',
      citizenId: 'cit-001',
      citizenName: 'Priya Sundaram',
      citizenPhoneMasked: '+91 98401 •••••',
      category: 'ROAD',
      subcategory: 'POTHOLE',
      title: 'Large dangerous crater pothole near Madipakkam Koot Road junction',
      description: 'Madipakkam main road la oru periya pothole irukku. 2 wheelers fall down at night due to poor lighting.',
      aiSummary: 'Citizen reported a deep crater-like pothole measuring approximately 4x3 feet on Madipakkam Main Road near Koot Road junction. Active for 12 days; poses serious skid & accident hazard for two-wheelers in low-light conditions.',
      location: {
        latitude: 12.9647,
        longitude: 80.1961,
        address: 'Madipakkam Main Road, Opposite Indian Bank',
        area: 'Madipakkam',
        landmark: 'Near Koot Road Signal',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600091'
      },
      priority: 'HIGH',
      riskScore: 84,
      status: 'AWAITING_CITIZEN_VERIFICATION',
      language: 'Tamil (தமிழ்)',
      confidenceScore: 94,
      sentiment: 'CONCERNED',
      departmentId: 'dept-road',
      departmentName: 'Municipal Corporation (Roads & Works)',
      assignedOfficerId: 'gov-officer-01',
      assignedOfficerName: 'V. Ramanathan',
      clusterId: 'cl-001',
      relatedReportCount: 18,
      slaHours: 48,
      slaCreatedAt: new Date(nowMs - 51 * H).toISOString(),
      slaDeadline: new Date(nowMs - 3 * H).toISOString(),
      slaStatus: 'OVERDUE',
      escalationLevel: 'LEVEL_1_SUPERVISOR',
      escalationReason: 'SLA exceeded 48 hours with 18 clustered citizen reports',
      escalatedAt: new Date(nowMs - 2.5 * H).toISOString(),
      citizenEvidence: {
        id: 'ev-c-001',
        ticketId: 'cmp-001',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9647,
        longitude: 80.1961,
        locationName: 'Madipakkam Main Road (GPS Verified)',
        capturedAt: '2026-08-13T10:05:00Z',
        uploadedAt: '2026-08-13T10:06:00Z',
        uploadedBy: 'cit-001',
        uploaderName: 'Priya Sundaram',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        notes: 'Citizen uploaded live photo showing deep asphalt erosion.',
        visualTags: ['asphalt damage', 'deep pothole', 'road erosion', 'urban street']
      },
      governmentEvidence: {
        id: 'ev-g-001',
        ticketId: 'cmp-001',
        type: 'GOVERNMENT',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9648,
        longitude: 80.1962,
        locationName: 'Madipakkam Main Road, Site Repair Geo-Pin',
        capturedAt: '2026-08-15T16:30:00Z',
        uploadedAt: '2026-08-15T16:35:00Z',
        uploadedBy: 'gov-officer-01',
        uploaderName: 'V. Ramanathan',
        uploaderRole: 'OFFICER',
        metadataVerified: true,
        notes: 'Cold mix patch layering completed, roller leveled, safety cones cleared.',
        visualTags: ['fresh asphalt', 'repaired surface', 'smooth patch', 'road level']
      },
      aiVerification: {
        status: 'LIKELY_MATCH',
        confidence: 89,
        evidenceMatchScore: 92,
        visualSimilarityScore: 91,
        locationMatchScore: 98,
        repairDetected: true,
        analysisNotes: 'High visual continuity in surrounding curb and building facade. Pre-existing pothole crater is covered with fresh compacted bitumen overlay. GPS coordinates align within 12 meters.',
        detectedFeatures: ['matching building background', 'consistent road curbing', 'new asphalt patch covering damage'],
        comparedAt: '2026-08-15T16:36:00Z'
      },
      citizenVerification: {
        status: 'PENDING',
        rejectionCount: 0
      },
      officerNotes: [
        {
          timestamp: '2026-08-14T09:00:00Z',
          officerName: 'V. Ramanathan',
          note: 'Inspected spot with road gang. Material dispatched from Pallavaram plant.'
        },
        {
          timestamp: '2026-08-15T16:30:00Z',
          officerName: 'V. Ramanathan',
          note: 'Completed hot bitumen sealing. Uploaded geo-tagged completion photo.'
        }
      ],
      createdAt: '2026-08-13T10:00:00Z',
      updatedAt: '2026-08-15T16:36:00Z',
      assignedAt: '2026-08-13T11:30:00Z',
      workStartedAt: '2026-08-14T09:00:00Z',
      evidenceSubmittedAt: '2026-08-15T16:35:00Z'
    },
    {
      id: 'cmp-002',
      token: 'WTR-2026-000088',
      citizenId: 'cit-002',
      citizenName: 'Arun Kumar',
      citizenPhoneMasked: '+91 98402 •••••',
      category: 'WATER',
      subcategory: 'CONTAMINATION',
      title: 'Muddy brown foul-smelling tap water in residential pipeline',
      description: 'Since yesterday morning our municipal drinking water line is delivering brownish water with strong sewer odor. 40 flats affected.',
      aiSummary: 'Citizen reports severe potable water pipeline contamination with sewage mixing in Velachery Bypass Sector 3. High public health risk impacting approx 40 households.',
      location: {
        latitude: 12.9785,
        longitude: 80.2217,
        address: '7th Cross St, Velachery Bypass Road',
        area: 'Velachery',
        landmark: 'Behind Grand Square Mall',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600042'
      },
      priority: 'HIGH',
      riskScore: 78,
      status: 'IN_PROGRESS',
      language: 'English',
      confidenceScore: 96,
      sentiment: 'FRUSTRATED',
      departmentId: 'dept-water',
      departmentName: 'Water Supply & Sewerage Board',
      assignedOfficerId: 'gov-officer-02',
      assignedOfficerName: 'Deepa Krishnan',
      clusterId: 'cl-002',
      relatedReportCount: 14,
      slaHours: 24,
      slaCreatedAt: new Date(nowMs - 18 * H).toISOString(),
      slaDeadline: new Date(nowMs + 6 * H).toISOString(),
      slaStatus: 'DUE_SOON',
      escalationLevel: 'NONE',
      citizenEvidence: {
        id: 'ev-c-002',
        ticketId: 'cmp-002',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9785,
        longitude: 80.2217,
        locationName: 'Velachery 7th Cross (GPS Verified)',
        capturedAt: new Date(nowMs - 17.8 * H).toISOString(),
        uploadedAt: new Date(nowMs - 17.7 * H).toISOString(),
        uploadedBy: 'cit-002',
        uploaderName: 'Arun Kumar',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        notes: 'Bucket photo showing contaminated brownish tap discharge.',
        visualTags: ['turbid water', 'contamination', 'domestic supply']
      },
      officerNotes: [
        {
          timestamp: new Date(nowMs - 14 * H).toISOString(),
          officerName: 'Deepa Krishnan',
          note: 'Identified underground fracture near storm drain intersection. Excavator team on site.'
        }
      ],
      createdAt: new Date(nowMs - 18 * H).toISOString(),
      updatedAt: new Date(nowMs - 14 * H).toISOString(),
      assignedAt: new Date(nowMs - 16 * H).toISOString(),
      workStartedAt: new Date(nowMs - 14 * H).toISOString()
    },
    {
      id: 'cmp-003',
      token: 'ELEC-2026-000041',
      citizenId: 'cit-003',
      citizenName: 'Lakshmi Narayanan',
      citizenPhoneMasked: '+91 98403 •••••',
      category: 'ELECTRICITY',
      subcategory: 'FALLEN_WIRE',
      title: 'Live high-tension cable snapped and sparking across pedestrian footpath',
      description: 'A transformer feed cable broke off and is sparking continuously near the auto stand. Immediate electrocution threat to pedestrians and school children.',
      aiSummary: 'CRITICAL EMERGENCY: Live overhead electrical wire snapped and lying energized on public sidewalk near Tambaram Bus Stand. Sparks observed; high risk of fatal electrocution.',
      location: {
        latitude: 12.9249,
        longitude: 80.1248,
        address: 'GST Road, Near Tambaram Sanatorium Station',
        area: 'Tambaram',
        landmark: 'Opposite Auto Stand No. 3',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600045'
      },
      priority: 'CRITICAL',
      riskScore: 96,
      status: 'ASSIGNED',
      language: 'Tamil (தமிழ்)',
      confidenceScore: 98,
      sentiment: 'URGENT',
      departmentId: 'dept-elec',
      departmentName: 'Electricity Distribution Corp',
      assignedOfficerId: 'gov-officer-03',
      assignedOfficerName: 'K. Balaji',
      clusterId: 'cl-003',
      relatedReportCount: 9,
      slaHours: 8,
      slaCreatedAt: new Date(nowMs - 6.5 * H).toISOString(),
      slaDeadline: new Date(nowMs + 1.5 * H).toISOString(),
      slaStatus: 'DUE_SOON',
      escalationLevel: 'NONE',
      citizenEvidence: {
        id: 'ev-c-003',
        ticketId: 'cmp-003',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9249,
        longitude: 80.1248,
        locationName: 'Tambaram GST Road (GPS Verified)',
        capturedAt: new Date(nowMs - 6.4 * H).toISOString(),
        uploadedAt: new Date(nowMs - 6.3 * H).toISOString(),
        uploadedBy: 'cit-003',
        uploaderName: 'Lakshmi Narayanan',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        notes: 'Live wire dangling across the walkway with spark marks.',
        visualTags: ['electrical hazard', 'snapped cable', 'sidewalk danger']
      },
      officerNotes: [
        {
          timestamp: new Date(nowMs - 5 * H).toISOString(),
          officerName: 'K. Balaji',
          note: 'Emergency substation feeder trip command issued. Rapid response team rushing to isolate the line.'
        }
      ],
      createdAt: new Date(nowMs - 6.5 * H).toISOString(),
      updatedAt: new Date(nowMs - 5 * H).toISOString(),
      assignedAt: new Date(nowMs - 6 * H).toISOString()
    },
    {
      id: 'cmp-004',
      token: 'GARB-2026-000104',
      citizenId: 'cit-001',
      citizenName: 'Priya Sundaram',
      citizenPhoneMasked: '+91 98401 •••••',
      category: 'GARBAGE',
      subcategory: 'OVERFLOW',
      title: 'Massive garbage pile overflow blocking Adyar bridge sidewalk',
      description: 'Solid waste uncollected for over 6 days. Stray cattle and dogs scattering waste onto moving traffic.',
      aiSummary: 'Uncollected municipal garbage bins overflowing onto pedestrian walkway and road shoulder in Adyar. 6 days accumulation; vector breeding & traffic hazard.',
      location: {
        latitude: 13.0012,
        longitude: 80.2565,
        address: 'Adyar Canal Bank Road, Near Malar Hospital',
        area: 'Adyar',
        landmark: 'Near Canal Bridge',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600020'
      },
      priority: 'MEDIUM',
      riskScore: 58,
      status: 'AWAITING_RESOLUTION_EVIDENCE',
      language: 'English',
      confidenceScore: 92,
      sentiment: 'CONCERNED',
      departmentId: 'dept-garb',
      departmentName: 'Solid Waste Management',
      assignedOfficerId: 'gov-officer-04',
      assignedOfficerName: 'M. Jayanthi',
      clusterId: 'cl-004',
      relatedReportCount: 11,
      slaHours: 24,
      slaCreatedAt: new Date(nowMs - 29 * H).toISOString(),
      slaDeadline: new Date(nowMs - 5 * H).toISOString(),
      slaStatus: 'OVERDUE',
      escalationLevel: 'LEVEL_1_SUPERVISOR',
      escalationReason: 'SLA deadline exceeded for commercial arterial corridor',
      escalatedAt: new Date(nowMs - 4 * H).toISOString(),
      citizenEvidence: {
        id: 'ev-c-004',
        ticketId: 'cmp-004',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
        latitude: 13.0012,
        longitude: 80.2565,
        locationName: 'Adyar Canal Bank (GPS Verified)',
        capturedAt: '2026-08-14T11:05:00Z',
        uploadedAt: '2026-08-14T11:10:00Z',
        uploadedBy: 'cit-001',
        uploaderName: 'Priya Sundaram',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        notes: 'Commercial trash spilling into road lane.',
        visualTags: ['garbage overflow', 'solid waste', 'street litter']
      },
      createdAt: '2026-08-14T11:00:00Z',
      updatedAt: '2026-08-15T12:00:00Z',
      assignedAt: '2026-08-14T12:30:00Z',
      workStartedAt: '2026-08-15T08:00:00Z'
    },
    {
      id: 'cmp-005',
      token: 'ROAD-2026-000142',
      citizenId: 'cit-002',
      citizenName: 'Arun Kumar',
      citizenPhoneMasked: '+91 98402 •••••',
      category: 'ROAD',
      subcategory: 'ROAD_DAMAGE',
      title: 'Dislodged storm-water drain concrete slab on Guindy Industrial Estate road',
      description: 'Heavy truck cracked the drain cover slab. Open pit deep enough for a motorcycle wheel to get stuck completely.',
      aiSummary: 'Severe structural break in roadside storm drain cover slab in Guindy Industrial Estate Phase 2. Hazardous open ditch on traffic lane.',
      location: {
        latitude: 13.0067,
        longitude: 80.2012,
        address: 'Guindy Industrial Estate, Near TVS Showroom',
        area: 'Guindy',
        landmark: 'Opp TVS Service',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600032'
      },
      priority: 'HIGH',
      riskScore: 76,
      status: 'RESOLVED',
      language: 'English',
      confidenceScore: 95,
      sentiment: 'CONCERNED',
      departmentId: 'dept-road',
      departmentName: 'Municipal Corporation (Roads & Works)',
      assignedOfficerId: 'gov-officer-01',
      assignedOfficerName: 'V. Ramanathan',
      relatedReportCount: 4,
      slaHours: 48,
      slaCreatedAt: new Date(nowMs - 50 * H).toISOString(),
      slaDeadline: new Date(nowMs - 2 * H).toISOString(),
      slaStatus: 'ON_TRACK',
      escalationLevel: 'NONE',
      citizenEvidence: {
        id: 'ev-c-005',
        ticketId: 'cmp-005',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
        latitude: 13.0067,
        longitude: 80.2012,
        locationName: 'Guindy Estate (GPS Verified)',
        capturedAt: new Date(nowMs - 49.8 * H).toISOString(),
        uploadedAt: new Date(nowMs - 49.7 * H).toISOString(),
        uploadedBy: 'cit-002',
        uploaderName: 'Arun Kumar',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        visualTags: ['broken concrete', 'drain hazard', 'roadside crack']
      },
      governmentEvidence: {
        id: 'ev-g-005',
        ticketId: 'cmp-005',
        type: 'GOVERNMENT',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        latitude: 13.0067,
        longitude: 80.2012,
        locationName: 'Guindy Estate Repair Verification Geo-Pin',
        capturedAt: new Date(nowMs - 24 * H).toISOString(),
        uploadedAt: new Date(nowMs - 23.8 * H).toISOString(),
        uploadedBy: 'gov-officer-01',
        uploaderName: 'V. Ramanathan',
        uploaderRole: 'OFFICER',
        metadataVerified: true,
        notes: 'Replaced with reinforced RCC Grade 40 heavy-duty cover slab.',
        visualTags: ['new concrete slab', 'secure drain cover', 'finished road work']
      },
      aiVerification: {
        status: 'MATCHED',
        confidence: 94,
        evidenceMatchScore: 96,
        visualSimilarityScore: 93,
        locationMatchScore: 99,
        repairDetected: true,
        analysisNotes: 'Exact location verified against storefront signage. Damaged slab completely replaced with new steel-framed concrete cover. Safe for vehicular movement.',
        detectedFeatures: ['matching commercial facade', 'brand new RCC slab', 'fully flushed drain cover'],
        comparedAt: new Date(nowMs - 23.7 * H).toISOString()
      },
      citizenVerification: {
        status: 'ACCEPTED',
        verifiedAt: new Date(nowMs - 20 * H).toISOString(),
        rejectionCount: 0
      },
      createdAt: new Date(nowMs - 50 * H).toISOString(),
      updatedAt: new Date(nowMs - 20 * H).toISOString(),
      assignedAt: new Date(nowMs - 48 * H).toISOString(),
      workStartedAt: new Date(nowMs - 36 * H).toISOString(),
      evidenceSubmittedAt: new Date(nowMs - 23.8 * H).toISOString(),
      resolvedAt: new Date(nowMs - 20 * H).toISOString(),
      closedAt: new Date(nowMs - 20 * H).toISOString()
    },
    {
      id: 'cmp-006',
      token: 'ROAD-2026-000155',
      citizenId: 'cit-003',
      citizenName: 'Lakshmi Narayanan',
      citizenPhoneMasked: '+91 98403 •••••',
      category: 'ROAD',
      subcategory: 'POTHOLE',
      title: 'Pothole patch poorly filled with loose mud and washed away in rain',
      description: 'The officer marked it repaired previously, but they only dumped loose gravel. The first drizzle washed it away and the hole is now wider.',
      aiSummary: 'Citizen DISPUTE: Defective road repair rejected by citizen in Chromepet Station Road. Loose aggregates washed away; requires asphalt resurfacing.',
      location: {
        latitude: 12.9516,
        longitude: 80.1462,
        address: 'Station Road, Near Chromepet Railway Gate',
        area: 'Chromepet',
        landmark: 'Near Railway Station Gate 2',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600044'
      },
      priority: 'HIGH',
      riskScore: 82,
      status: 'RESOLUTION_REJECTED',
      language: 'Tamil (தமிழ்)',
      confidenceScore: 91,
      sentiment: 'ANGRY',
      departmentId: 'dept-road',
      departmentName: 'Municipal Corporation (Roads & Works)',
      assignedOfficerId: 'gov-officer-01',
      assignedOfficerName: 'V. Ramanathan',
      clusterId: 'cl-001',
      relatedReportCount: 6,
      slaHours: 48,
      slaCreatedAt: new Date(nowMs - 52 * H).toISOString(),
      slaDeadline: new Date(nowMs - 4 * H).toISOString(),
      slaStatus: 'OVERDUE',
      escalationLevel: 'LEVEL_2_ADMIN',
      escalationReason: 'Citizen rejected government resolution; 2nd inspection failure',
      escalatedAt: new Date(nowMs - 3 * H).toISOString(),
      citizenEvidence: {
        id: 'ev-c-006',
        ticketId: 'cmp-006',
        type: 'CITIZEN',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9516,
        longitude: 80.1462,
        locationName: 'Chromepet Station Rd (GPS Verified)',
        capturedAt: '2026-08-13T14:05:00Z',
        uploadedAt: '2026-08-13T14:10:00Z',
        uploadedBy: 'cit-003',
        uploaderName: 'Lakshmi Narayanan',
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        visualTags: ['pothole crater', 'loose gravel', 'eroded road']
      },
      governmentEvidence: {
        id: 'ev-g-006',
        ticketId: 'cmp-006',
        type: 'GOVERNMENT',
        imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
        latitude: 12.9517,
        longitude: 80.1463,
        locationName: 'Chromepet Station Rd Repair Proof',
        capturedAt: '2026-08-14T17:00:00Z',
        uploadedAt: '2026-08-14T17:15:00Z',
        uploadedBy: 'gov-officer-01',
        uploaderName: 'V. Ramanathan',
        uploaderRole: 'OFFICER',
        metadataVerified: true,
        notes: 'Gravel filling with temporary seal.',
        visualTags: ['gravel fill', 'temporary patch']
      },
      aiVerification: {
        status: 'UNCERTAIN',
        confidence: 62,
        evidenceMatchScore: 58,
        visualSimilarityScore: 60,
        locationMatchScore: 94,
        repairDetected: false,
        analysisNotes: 'Substandard filling detected. Bituminous emulsion layer absent; loose aggregate particles visible without compaction. High vulnerability to rain degradation.',
        detectedFeatures: ['unbound gravel stones', 'absence of asphalt seal', 'potential crater recurrence'],
        rejectionReason: 'Repair does not meet permanent bitumen standards.',
        comparedAt: '2026-08-14T17:20:00Z'
      },
      citizenVerification: {
        status: 'REJECTED',
        verifiedAt: '2026-08-15T09:00:00Z',
        reason: 'Temporary mud/gravel washed off within hours. Hole is still dangerous.',
        comment: 'Please do proper asphalt hot mix leveling instead of just throwing mud on the road.',
        rejectionCount: 2
      },
      createdAt: '2026-08-13T14:00:00Z',
      updatedAt: '2026-08-15T15:20:00Z',
      assignedAt: '2026-08-13T15:00:00Z',
      workStartedAt: '2026-08-14T10:00:00Z',
      evidenceSubmittedAt: '2026-08-14T17:15:00Z'
    }
  ];

  // Generate additional structured complaints across Chennai zones
  const areas = [
    { name: 'Madipakkam', lat: 12.9647, lng: 80.1961 },
    { name: 'Velachery', lat: 12.9785, lng: 80.2217 },
    { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
    { name: 'Guindy', lat: 13.0067, lng: 80.2012 },
    { name: 'Tambaram', lat: 12.9249, lng: 80.1248 },
    { name: 'Chromepet', lat: 12.9516, lng: 80.1462 },
    { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
    { name: 'Mylapore', lat: 13.0368, lng: 80.2676 },
    { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101 },
    { name: 'Pallavaram', lat: 12.9675, lng: 80.1491 }
  ];

  const categoriesConfig = [
    {
      category: 'ROAD' as const,
      subcategories: ['POTHOLE', 'ROAD_DAMAGE', 'FLOODING', 'UNPAVED_STRETCH'],
      deptId: 'dept-road',
      deptName: 'Municipal Corporation (Roads & Works)',
      slaHours: 48,
      prefix: 'ROAD',
      images: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'WATER' as const,
      subcategories: ['PIPE_BURST', 'NO_SUPPLY', 'CONTAMINATION', 'LOW_PRESSURE', 'SEWAGE_OVERFLOW'],
      deptId: 'dept-water',
      deptName: 'Water Supply & Sewerage Board',
      slaHours: 24,
      prefix: 'WTR',
      images: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'ELECTRICITY' as const,
      subcategories: ['POWER_OUTAGE', 'FALLEN_WIRE', 'TRANSFORMER_BLOW', 'VOLTAGE_FLUCTUATION', 'STREETLIGHT_OUT'],
      deptId: 'dept-elec',
      deptName: 'Electricity Distribution Corp',
      slaHours: 8,
      prefix: 'ELEC',
      images: [
        'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'GARBAGE' as const,
      subcategories: ['OVERFLOW', 'MISSED_COLLECTION', 'ILLEGAL_DUMPING', 'DRAIN_CLOG'],
      deptId: 'dept-garb',
      deptName: 'Solid Waste Management',
      slaHours: 24,
      prefix: 'GARB',
      images: [
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'TRANSPORT' as const,
      subcategories: ['TRAFFIC_SIGNAL', 'BUS_STOP_DAMAGE', 'ILLEGAL_PARKING', 'SPEED_BREAKER'],
      deptId: 'dept-trans',
      deptName: 'Metropolitan Transport',
      slaHours: 36,
      prefix: 'TRANS',
      images: [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'HEALTHCARE' as const,
      subcategories: ['MOSQUITO_BREEDING', 'CLINIC_FACILITY', 'STRAY_DOG_MENACE'],
      deptId: 'dept-health',
      deptName: 'Public Health & Disease Prevention',
      slaHours: 12,
      prefix: 'HLTH',
      images: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'POLICE' as const,
      subcategories: ['ENCROACHMENT', 'PUBLIC_NUISANCE', 'SAFETY_HAZARD'],
      deptId: 'dept-police',
      deptName: 'City Police & Public Safety Cell',
      slaHours: 4,
      prefix: 'POL',
      images: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      category: 'DISASTER' as const,
      subcategories: ['WATER_LOGGING', 'FALLEN_TREE', 'WALL_COLLAPSE_RISK'],
      deptId: 'dept-disaster',
      deptName: 'Disaster Management & Flood Control Cell',
      slaHours: 2,
      prefix: 'DM',
      images: [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80'
      ]
    }
  ];

  const statuses: Complaint['status'][] = [
    'NEW',
    'AWAITING_CITIZEN_EVIDENCE',
    'VERIFIED',
    'ASSIGNED',
    'IN_PROGRESS',
    'AWAITING_RESOLUTION_EVIDENCE',
    'AI_VERIFICATION',
    'AWAITING_CITIZEN_VERIFICATION',
    'RESOLVED',
    'CLOSED'
  ];

  const priorities: Complaint['priority'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const generatedList: Complaint[] = [...baseList];

  for (let i = 7; i <= 100; i++) {
    const areaIdx = i % areas.length;
    const catConfig = categoriesConfig[i % categoriesConfig.length];
    const areaObj = areas[areaIdx];
    const subcategory = catConfig.subcategories[i % catConfig.subcategories.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    
    // small coordinate jitter around area center
    const latOffset = ((i * 13) % 40 - 20) * 0.0006;
    const lngOffset = ((i * 17) % 40 - 20) * 0.0006;

    const tokenNum = String(i).padStart(6, '0');
    const token = `${catConfig.prefix}-2026-${tokenNum}`;
    const riskScore = priority === 'CRITICAL' ? 85 + (i % 15) : priority === 'HIGH' ? 65 + (i % 20) : priority === 'MEDIUM' ? 40 + (i % 25) : 15 + (i % 20);

    const daysAgo = (i % 10) + 1;
    const dateCreated = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + (i * 3600000)).toISOString();
    const slaDeadline = new Date(new Date(dateCreated).getTime() + catConfig.slaHours * 3600000).toISOString();
    const isOverdue = new Date(slaDeadline).getTime() < Date.now() && status !== 'RESOLVED' && status !== 'CLOSED';

    const citizenNames = ['S. Meenakshi', 'G. Vignesh', 'R. Karthikeyan', 'S. Anand', 'B. Radhika', 'K. Suresh', 'T. Divya', 'M. Venkatesh'];
    const citizenName = citizenNames[i % citizenNames.length];
    const citizenId = `cit-gen-${i % 20}`;

    const assignedOfficer = OFFICERS[i % OFFICERS.length];

    generatedList.push({
      id: `cmp-${i}`,
      token,
      citizenId,
      citizenName,
      citizenPhoneMasked: `+91 9840${i % 9} •••••`,
      category: catConfig.category,
      subcategory,
      title: `${subcategory.replace(/_/g, ' ')} near ${areaObj.name} Main Road`,
      description: `Reported civic defect regarding ${subcategory.toLowerCase().replace(/_/g, ' ')} affecting residents and commuter safety in ${areaObj.name}.`,
      aiSummary: `SEVA AI verified issue: ${subcategory.replace(/_/g, ' ')} in ${areaObj.name}. Duration approx ${daysAgo} days. Department routed: ${catConfig.deptName}.`,
      location: {
        latitude: +(areaObj.lat + latOffset).toFixed(6),
        longitude: +(areaObj.lng + lngOffset).toFixed(6),
        address: `Ward ${100 + (i % 50)}, ${areaObj.name} Main Road`,
        area: areaObj.name,
        landmark: `Near Landmark #${(i % 15) + 1}`,
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: `6000${(i % 50).toString().padStart(2, '0')}`
      },
      priority,
      riskScore,
      status,
      language: i % 2 === 0 ? 'English' : 'Tamil (தமிழ்)',
      confidenceScore: 88 + (i % 12),
      sentiment: priority === 'CRITICAL' ? 'URGENT' : priority === 'HIGH' ? 'FRUSTRATED' : 'NEUTRAL',
      departmentId: catConfig.deptId,
      departmentName: catConfig.deptName,
      assignedOfficerId: status !== 'NEW' ? assignedOfficer.id : undefined,
      assignedOfficerName: status !== 'NEW' ? assignedOfficer.name : undefined,
      relatedReportCount: (i % 7) + 1,
      slaHours: catConfig.slaHours,
      slaCreatedAt: dateCreated,
      slaDeadline,
      slaStatus: isOverdue ? 'OVERDUE' : status === 'RESOLVED' || status === 'CLOSED' ? 'ON_TRACK' : 'DUE_SOON',
      escalationLevel: isOverdue ? 'LEVEL_1_SUPERVISOR' : 'NONE',
      citizenEvidence: status !== 'AWAITING_CITIZEN_EVIDENCE' && status !== 'NEW' ? {
        id: `ev-c-gen-${i}`,
        ticketId: `cmp-${i}`,
        type: 'CITIZEN',
        imageUrl: catConfig.images[0],
        latitude: +(areaObj.lat + latOffset).toFixed(6),
        longitude: +(areaObj.lng + lngOffset).toFixed(6),
        locationName: `${areaObj.name} Location Verified`,
        capturedAt: dateCreated,
        uploadedAt: dateCreated,
        uploadedBy: citizenId,
        uploaderName: citizenName,
        uploaderRole: 'CITIZEN',
        metadataVerified: true,
        visualTags: [subcategory.toLowerCase(), 'civic issue', 'urban street']
      } : undefined,
      governmentEvidence: (status === 'RESOLVED' || status === 'CLOSED' || status === 'AWAITING_CITIZEN_VERIFICATION') ? {
        id: `ev-g-gen-${i}`,
        ticketId: `cmp-${i}`,
        type: 'GOVERNMENT',
        imageUrl: catConfig.images[catConfig.images.length - 1],
        latitude: +(areaObj.lat + latOffset).toFixed(6),
        longitude: +(areaObj.lng + lngOffset).toFixed(6),
        locationName: `${areaObj.name} Resolution Site Geo-Pin`,
        capturedAt: new Date(Date.now() - 3600000).toISOString(),
        uploadedAt: new Date(Date.now() - 3600000).toISOString(),
        uploadedBy: assignedOfficer.id,
        uploaderName: assignedOfficer.name,
        uploaderRole: 'OFFICER',
        metadataVerified: true,
        notes: 'Remediation completed by field squad.',
        visualTags: ['resolved work', 'verified site', 'restoration']
      } : undefined,
      aiVerification: (status === 'RESOLVED' || status === 'CLOSED' || status === 'AWAITING_CITIZEN_VERIFICATION') ? {
        status: 'MATCHED',
        confidence: 91,
        evidenceMatchScore: 94,
        visualSimilarityScore: 90,
        locationMatchScore: 97,
        repairDetected: true,
        analysisNotes: 'Verified resolution against initial damage signature. High visual match.',
        detectedFeatures: ['matching scene boundary', 'repaired surface', 'hazard neutralized'],
        comparedAt: new Date(Date.now() - 3500000).toISOString()
      } : undefined,
      citizenVerification: status === 'RESOLVED' || status === 'CLOSED' ? {
        status: 'ACCEPTED',
        verifiedAt: new Date(Date.now() - 1800000).toISOString(),
        rejectionCount: 0
      } : status === 'AWAITING_CITIZEN_VERIFICATION' ? {
        status: 'PENDING',
        rejectionCount: 0
      } : undefined,
      createdAt: dateCreated,
      updatedAt: new Date().toISOString()
    });
  }

  return generatedList;
}

export const TRIGGER_RECORDS: TriggerRecord[] = [
  {
    id: 'trig-001',
    triggerType: 'SLA_BREACH',
    ticketId: 'cmp-001',
    ticketToken: 'ROAD-2026-000123',
    title: 'Madipakkam Main Road Crater Pothole (18 Reports)',
    area: 'Madipakkam, Chennai',
    reportCount: 18,
    daysUnresolved: 12,
    priority: 'HIGH',
    riskScore: 84,
    departmentName: 'Municipal Corporation (Roads & Works)',
    triggeredAt: '2026-08-15T11:00:00Z',
    status: 'ACTIVE',
    actionRequired: 'Supervisory review and contractor penalty enforcement'
  },
  {
    id: 'trig-002',
    triggerType: 'CRITICAL_ISSUE',
    ticketId: 'cmp-003',
    ticketToken: 'ELEC-2026-000041',
    title: 'Live High-Tension Sparking Wire on Pedestrian Path',
    area: 'Tambaram, Chennai',
    reportCount: 9,
    daysUnresolved: 1,
    priority: 'CRITICAL',
    riskScore: 96,
    departmentName: 'Electricity Distribution Corp',
    triggeredAt: '2026-08-15T17:40:00Z',
    status: 'ACTIVE',
    actionRequired: 'Immediate electrical isolation & public perimeter cordoning'
  },
  {
    id: 'trig-003',
    triggerType: 'CITIZEN_REJECTED',
    ticketId: 'cmp-006',
    ticketToken: 'ROAD-2026-000155',
    title: 'Defective Road Patch Rejected 2x by Citizen',
    area: 'Chromepet, Chennai',
    reportCount: 6,
    daysUnresolved: 3,
    priority: 'HIGH',
    riskScore: 82,
    departmentName: 'Municipal Corporation (Roads & Works)',
    triggeredAt: '2026-08-15T09:00:00Z',
    status: 'ACTIVE',
    actionRequired: 'Admin dispute intervention; deploy certified asphalt paving crew'
  },
  {
    id: 'trig-004',
    triggerType: 'HOTSPOT_DETECTED',
    ticketId: 'cmp-002',
    ticketToken: 'WTR-2026-000088',
    title: 'Velachery Bypass Water Contamination Cluster (14 Reports)',
    area: 'Velachery, Chennai',
    reportCount: 14,
    daysUnresolved: 2,
    priority: 'HIGH',
    riskScore: 78,
    departmentName: 'Water Supply & Sewerage Board',
    triggeredAt: '2026-08-15T08:30:00Z',
    status: 'ACTIVE',
    actionRequired: 'Contamination plume isolation and emergency tanker supply'
  },
  {
    id: 'trig-005',
    triggerType: 'RAPID_INCREASE',
    ticketId: 'cmp-004',
    ticketToken: 'GARB-2026-000104',
    title: 'Rapid 300% Spike in Adyar Canal Solid Waste Dumps',
    area: 'Adyar, Chennai',
    reportCount: 11,
    daysUnresolved: 4,
    priority: 'MEDIUM',
    riskScore: 68,
    departmentName: 'Solid Waste Management',
    triggeredAt: '2026-08-14T18:00:00Z',
    status: 'ACTIVE',
    actionRequired: 'Mobilize mechanical compactors and night clearing squad'
  },
  {
    id: 'trig-006',
    triggerType: 'AI_FLAG',
    ticketId: 'cmp-006',
    ticketToken: 'ROAD-2026-000155',
    title: 'AI Vision Match Failed: Low Durability Aggregate Fill',
    area: 'Chromepet, Chennai',
    reportCount: 6,
    daysUnresolved: 3,
    priority: 'HIGH',
    riskScore: 82,
    departmentName: 'Municipal Corporation (Roads & Works)',
    triggeredAt: '2026-08-14T17:20:00Z',
    status: 'ACTIVE',
    actionRequired: 'Department quality re-audit requested'
  },
  {
    id: 'trig-007',
    triggerType: 'LONG_UNRESOLVED',
    ticketId: 'cmp-012',
    ticketToken: 'WTR-2026-000012',
    title: 'Chronic Sump Backflow on Guindy Kathipara Feeder Line',
    area: 'Guindy, Chennai',
    reportCount: 8,
    daysUnresolved: 14,
    priority: 'HIGH',
    riskScore: 79,
    departmentName: 'Water Supply & Sewerage Board',
    triggeredAt: '2026-08-13T09:00:00Z',
    status: 'ACTIVE',
    actionRequired: 'Engineering inspection by Superintending Engineer'
  },
  {
    id: 'trig-008',
    triggerType: 'RECURRING_ISSUE',
    ticketId: 'cmp-024',
    ticketToken: 'ELEC-2026-000024',
    title: 'Transformer Overheating Trip (3rd Occurrence this month)',
    area: 'Pallavaram, Chennai',
    reportCount: 12,
    daysUnresolved: 5,
    priority: 'HIGH',
    riskScore: 74,
    departmentName: 'Electricity Distribution Corp',
    triggeredAt: '2026-08-12T14:30:00Z',
    status: 'ACKNOWLEDGED',
    actionRequired: 'Upgrade 250 kVA transformer unit to 500 kVA'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    recipientRole: 'CITIZEN',
    recipientId: 'cit-001',
    title: 'Resolution Evidence Submitted by Department',
    message: 'Municipal Corporation has uploaded repair proof for ROAD-2026-000123. Please verify if your issue is resolved.',
    type: 'WARNING',
    ticketId: 'cmp-001',
    ticketToken: 'ROAD-2026-000123',
    timestamp: '2026-08-15T16:36:00Z',
    read: false,
    actionUrl: '/citizen/reports/cmp-001'
  },
  {
    id: 'notif-002',
    recipientRole: 'ALL',
    title: '🚨 CRITICAL SAFETY ALERT: Live Wire at Tambaram',
    message: 'ELEC-2026-000041: Live wire reported on GST Road sidewalk. Emergency isolation in progress.',
    type: 'ALERT',
    ticketId: 'cmp-003',
    ticketToken: 'ELEC-2026-000041',
    timestamp: '2026-08-15T17:45:00Z',
    read: false,
    actionUrl: '/government/complaints/cmp-003'
  },
  {
    id: 'notif-003',
    recipientRole: 'CITIZEN',
    recipientId: 'cit-002',
    title: 'Officer Assigned to Water Issue',
    message: 'Engineer Deepa Krishnan (CMWSSB) has been assigned to investigate WTR-2026-000088.',
    type: 'INFO',
    ticketId: 'cmp-002',
    ticketToken: 'WTR-2026-000088',
    timestamp: '2026-08-15T09:15:00Z',
    read: true,
    actionUrl: '/citizen/reports/cmp-002'
  },
  {
    id: 'notif-004',
    recipientRole: 'OFFICER',
    title: '🚨 CITIZEN REJECTED RESOLUTION: ROAD-2026-000155',
    message: 'Citizen Lakshmi Narayanan rejected resolution citing washed-away gravel fill. Dispute escalated.',
    type: 'ALERT',
    ticketId: 'cmp-006',
    ticketToken: 'ROAD-2026-000155',
    timestamp: '2026-08-15T09:00:00Z',
    read: false,
    actionUrl: '/government/complaints/cmp-006'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-001',
    timestamp: '2026-08-15T16:36:00Z',
    userId: 'gov-officer-01',
    userName: 'V. Ramanathan (ENG-RD-402)',
    role: 'OFFICER',
    action: 'UPLOAD_RESOLUTION_EVIDENCE',
    entityType: 'EVIDENCE',
    entityId: 'ROAD-2026-000123',
    details: 'Uploaded geo-tagged resolution photo. AI Vision match score: 92%. Moved to Awaiting Citizen Verification.'
  },
  {
    id: 'aud-002',
    timestamp: '2026-08-15T15:20:00Z',
    userId: 'gov-supervisor-01',
    userName: 'S. Balasubramanian',
    role: 'SUPERVISOR',
    action: 'ESCALATION_TRIGGERED',
    entityType: 'ESCALATION',
    entityId: 'ROAD-2026-000155',
    details: 'Escalated to Level 2 (Admin) following 2nd citizen resolution rejection for defective asphalt.'
  },
  {
    id: 'aud-003',
    timestamp: '2026-08-15T17:48:00Z',
    userId: 'gov-admin',
    userName: 'K. Rajasekaran, IAS',
    role: 'ADMIN',
    action: 'CRITICAL_DISPATCH',
    entityType: 'COMPLAINT',
    entityId: 'ELEC-2026-000041',
    details: 'Emergency high-priority dispatch to TANGEDCO rapid response unit for live sparking wire.'
  },
  {
    id: 'aud-004',
    timestamp: '2026-08-15T09:15:00Z',
    userId: 'gov-dept-road',
    userName: 'M. Senthil Nathan',
    role: 'DEPARTMENT_ADMIN',
    action: 'ASSIGN_OFFICER',
    entityType: 'OFFICER',
    entityId: 'WTR-2026-000088',
    details: 'Assigned Senior Engineer Deepa Krishnan for Velachery contamination investigation.'
  }
];
