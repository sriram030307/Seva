import { Complaint, ComplaintStatus, PriorityLevel, SlaStatus } from '../types';

export type SlaSeverity = 'RESOLVED' | 'BREACHED' | 'CRITICAL_WARNING' | 'APPROACHING_BREACH' | 'HEALTHY';

export interface SlaCountdownInfo {
  complaintId: string;
  token: string;
  title: string;
  category: string;
  departmentId: string;
  departmentName: string;
  priority: PriorityLevel;
  status: ComplaintStatus;
  assignedOfficerName?: string;
  locationArea: string;
  riskScore: number;
  
  slaHours: number;
  slaCreatedAt: string;
  slaDeadline: string;
  
  totalDurationMs: number;
  elapsedMs: number;
  remainingMs: number;
  percentElapsed: number;
  
  severity: SlaSeverity;
  isBreached: boolean;
  isApproachingBreach: boolean;
  isCriticalWarning: boolean;
  
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  
  formattedCountdown: string;
  timeRemainingLabel: string;
  formattedDeadline: string;
  aiPredictedResolutionMinutes: number;
  aiPredictedResolutionLabel: string;
}

/**
 * Format milliseconds into HH:MM:SS format
 */
export function formatDurationHMS(ms: number): { hours: number; minutes: number; seconds: number; text: string } {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  
  const totalSeconds = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  
  return {
    hours: isNegative ? -hours : hours,
    minutes: isNegative ? -minutes : minutes,
    seconds: isNegative ? -seconds : seconds,
    text: isNegative ? `+${timeStr} OVERDUE` : timeStr
  };
}

/**
 * Calculate dynamic SLA countdown details for a single complaint
 */
export function calculateSlaInfo(
  complaint: Complaint, 
  referenceTimeMs: number = Date.now()
): SlaCountdownInfo {
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
  
  // Parse createdAt and deadline
  let createdTimeMs = new Date(complaint.slaCreatedAt || complaint.createdAt).getTime();
  let deadlineTimeMs = new Date(complaint.slaDeadline).getTime();
  
  if (isNaN(createdTimeMs)) {
    createdTimeMs = referenceTimeMs - 2 * 3600 * 1000;
  }
  
  const defaultDurationMs = (complaint.slaHours || 24) * 3600 * 1000;
  if (isNaN(deadlineTimeMs) || deadlineTimeMs <= createdTimeMs) {
    deadlineTimeMs = createdTimeMs + defaultDurationMs;
  }

  const totalDurationMs = Math.max(1000, deadlineTimeMs - createdTimeMs);
  const elapsedMs = Math.max(0, referenceTimeMs - createdTimeMs);
  const remainingMs = deadlineTimeMs - referenceTimeMs;
  
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
  
  const isBreached = remainingMs <= 0;
  const isCriticalWarning = !isResolved && remainingMs > 0 && remainingMs <= 4 * 3600 * 1000; // < 4 hours
  const isApproachingBreach = !isResolved && remainingMs > 4 * 3600 * 1000 && remainingMs <= 12 * 3600 * 1000; // 4h - 12h
  
  let severity: SlaSeverity = 'HEALTHY';
  if (isResolved) {
    severity = 'RESOLVED';
  } else if (isBreached) {
    severity = 'BREACHED';
  } else if (isCriticalWarning) {
    severity = 'CRITICAL_WARNING';
  } else if (isApproachingBreach) {
    severity = 'APPROACHING_BREACH';
  } else {
    severity = 'HEALTHY';
  }

  const hms = formatDurationHMS(remainingMs);
  
  // Short human-readable label
  let timeRemainingLabel = '';
  if (isResolved) {
    timeRemainingLabel = 'SLA Met (Closed)';
  } else if (isBreached) {
    const overdueHrs = Math.abs(Math.floor(remainingMs / (3600 * 1000)));
    const overdueMins = Math.abs(Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000)));
    timeRemainingLabel = `Breached by ${overdueHrs}h ${overdueMins}m`;
  } else {
    const remHrs = Math.floor(remainingMs / (3600 * 1000));
    const remMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    if (remHrs > 0) {
      timeRemainingLabel = `${remHrs}h ${remMins}m remaining`;
    } else {
      timeRemainingLabel = `${remMins}m ${Math.floor((remainingMs % (60 * 1000)) / 1000)}s remaining`;
    }
  }

  // Format deadline date
  const deadlineDate = new Date(deadlineTimeMs);
  const formattedDeadline = deadlineDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric'
  });

  // AI Predicted resolution time based on status & category
  let aiPredictedMinutes = 60;
  if (complaint.priority === 'CRITICAL') aiPredictedMinutes = 90;
  else if (complaint.category === 'ROAD') aiPredictedMinutes = 180;
  else if (complaint.category === 'WATER') aiPredictedMinutes = 120;
  else if (complaint.category === 'GARBAGE') aiPredictedMinutes = 45;
  
  if (complaint.status === 'IN_PROGRESS') aiPredictedMinutes = Math.max(20, Math.floor(aiPredictedMinutes * 0.4));
  else if (complaint.status === 'AWAITING_RESOLUTION_EVIDENCE') aiPredictedMinutes = 15;
  else if (complaint.status === 'AWAITING_CITIZEN_VERIFICATION') aiPredictedMinutes = 10;

  const aiPredictedResolutionLabel = isResolved 
    ? 'Completed' 
    : `Est. ~${aiPredictedMinutes >= 60 ? `${(aiPredictedMinutes / 60).toFixed(1)}h` : `${aiPredictedMinutes}m`} to resolve`;

  return {
    complaintId: complaint.id,
    token: complaint.token,
    title: complaint.title,
    category: complaint.category,
    departmentId: complaint.departmentId,
    departmentName: complaint.departmentName,
    priority: complaint.priority,
    status: complaint.status,
    assignedOfficerName: complaint.assignedOfficerName,
    locationArea: complaint.location?.area || 'Chennai',
    riskScore: complaint.riskScore || 50,
    
    slaHours: complaint.slaHours || 24,
    slaCreatedAt: complaint.slaCreatedAt || complaint.createdAt,
    slaDeadline: complaint.slaDeadline,
    
    totalDurationMs,
    elapsedMs,
    remainingMs,
    percentElapsed: Math.round(percentElapsed),
    
    severity,
    isBreached,
    isApproachingBreach,
    isCriticalWarning,
    
    hoursRemaining: hms.hours,
    minutesRemaining: hms.minutes,
    secondsRemaining: hms.seconds,
    
    formattedCountdown: isResolved ? 'RESOLVED' : hms.text,
    timeRemainingLabel,
    formattedDeadline,
    aiPredictedResolutionMinutes: aiPredictedMinutes,
    aiPredictedResolutionLabel
  };
}

/**
 * Returns color classes and styling tokens for a given SLA severity
 */
export function getSlaSeverityStyles(severity: SlaSeverity): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  cardBg: string;
  progressBarColor: string;
  timerTextColor: string;
  iconColor: string;
  pulseEffect: boolean;
  label: string;
} {
  switch (severity) {
    case 'BREACHED':
      return {
        badgeBg: 'bg-rose-950/80',
        badgeText: 'text-rose-300',
        badgeBorder: 'border-rose-600',
        cardBorder: 'border-rose-600/80',
        cardBg: 'bg-rose-950/20',
        progressBarColor: 'bg-rose-500',
        timerTextColor: 'text-rose-400 font-black',
        iconColor: 'text-rose-400',
        pulseEffect: true,
        label: 'SLA BREACHED'
      };
    case 'CRITICAL_WARNING':
      return {
        badgeBg: 'bg-amber-950/90',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500',
        cardBorder: 'border-amber-500/70',
        cardBg: 'bg-amber-950/20',
        progressBarColor: 'bg-amber-500',
        timerTextColor: 'text-amber-300 font-bold',
        iconColor: 'text-amber-400',
        pulseEffect: true,
        label: 'CRITICAL (< 4H)'
      };
    case 'APPROACHING_BREACH':
      return {
        badgeBg: 'bg-yellow-950/70',
        badgeText: 'text-yellow-300',
        badgeBorder: 'border-yellow-600/60',
        cardBorder: 'border-yellow-700/50',
        cardBg: 'bg-yellow-950/10',
        progressBarColor: 'bg-yellow-500',
        timerTextColor: 'text-yellow-400 font-semibold',
        iconColor: 'text-yellow-400',
        pulseEffect: false,
        label: 'APPROACHING (< 12H)'
      };
    case 'HEALTHY':
      return {
        badgeBg: 'bg-emerald-950/60',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-700/60',
        cardBorder: 'border-slate-800',
        cardBg: 'bg-slate-900/60',
        progressBarColor: 'bg-emerald-500',
        timerTextColor: 'text-emerald-400 font-semibold',
        iconColor: 'text-emerald-400',
        pulseEffect: false,
        label: 'ON TRACK'
      };
    case 'RESOLVED':
    default:
      return {
        badgeBg: 'bg-slate-900',
        badgeText: 'text-slate-400',
        badgeBorder: 'border-slate-700',
        cardBorder: 'border-slate-800/80',
        cardBg: 'bg-slate-900/40',
        progressBarColor: 'bg-blue-500',
        timerTextColor: 'text-slate-400',
        iconColor: 'text-slate-400',
        pulseEffect: false,
        label: 'RESOLVED'
      };
  }
}
