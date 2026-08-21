import React from 'react';
import { ComplaintStatus, PriorityLevel, SlaStatus, EscalationLevel, AIVerificationResult } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Camera, 
  UserCheck, 
  XCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const STATUS_CONFIG: Record<ComplaintStatus, {
  label: string;
  citizenLabel: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  NEW: {
    label: 'NEW',
    citizenLabel: 'Reported',
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-800/60',
    icon: Clock
  },
  AWAITING_CITIZEN_EVIDENCE: {
    label: 'AWAITING CITIZEN EVIDENCE',
    citizenLabel: 'Waiting for your photo',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    icon: Camera
  },
  WAITING_FOR_DEPARTMENT: {
    label: 'WAITING FOR DEPARTMENT',
    citizenLabel: 'Under Department Assignment',
    bg: 'bg-blue-950/70',
    text: 'text-blue-300',
    border: 'border-blue-700/60',
    icon: Clock
  },
  EVIDENCE_SUBMITTED: {
    label: 'EVIDENCE SUBMITTED',
    citizenLabel: 'Photo Evidence Logged',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/60',
    icon: FileCheck
  },
  DEPARTMENT_REVIEW: {
    label: 'DEPARTMENT HEAD REVIEW',
    citizenLabel: 'Under Dept Head Review',
    bg: 'bg-purple-950/70',
    text: 'text-purple-300',
    border: 'border-purple-700/70',
    icon: UserCheck
  },
  ADMIN_FINAL_REVIEW: {
    label: 'ADMIN FINAL REVIEW',
    citizenLabel: 'Apex Admin Final Decision',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-600/80',
    icon: Sparkles
  },
  FIELD_INSPECTION_REQUIRED: {
    label: 'FIELD INSPECTION ORDERED',
    citizenLabel: 'Physical Inspection Ordered',
    bg: 'bg-red-950/80',
    text: 'text-red-300',
    border: 'border-red-600',
    icon: AlertTriangle
  },
  ADDITIONAL_EVIDENCE_REQUIRED: {
    label: 'ADDITIONAL EVIDENCE REQUIRED',
    citizenLabel: 'Additional Proof Requested',
    bg: 'bg-amber-950/70',
    text: 'text-amber-400',
    border: 'border-amber-700',
    icon: Camera
  },
  VERIFIED: {
    label: 'GEO-VERIFIED',
    citizenLabel: 'Location Verified',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    icon: FileCheck
  },
  ASSIGNED: {
    label: 'ASSIGNED',
    citizenLabel: 'Officer Assigned',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-400',
    border: 'border-indigo-800/60',
    icon: UserCheck
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    citizenLabel: 'Work In Progress',
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-400',
    border: 'border-cyan-800/60',
    icon: Clock
  },
  AWAITING_RESOLUTION_EVIDENCE: {
    label: 'AWAITING RESOLUTION PROOF',
    citizenLabel: 'Work Finished, Awaiting Proof',
    bg: 'bg-purple-950/60',
    text: 'text-purple-400',
    border: 'border-purple-800/60',
    icon: Camera
  },
  AI_VERIFICATION: {
    label: 'AI VERIFICATION',
    citizenLabel: 'SEVA AI Checking Proof',
    bg: 'bg-violet-950/60',
    text: 'text-violet-400',
    border: 'border-violet-800/60',
    icon: Sparkles
  },
  AWAITING_CITIZEN_VERIFICATION: {
    label: 'AWAITING CITIZEN VERIFICATION',
    citizenLabel: 'Waiting for your verification',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-500/80',
    icon: AlertTriangle
  },
  RESOLUTION_REJECTED: {
    label: 'RESOLUTION REJECTED',
    citizenLabel: 'Resolution Rejected',
    bg: 'bg-rose-950/70',
    text: 'text-rose-400',
    border: 'border-rose-700/70',
    icon: XCircle
  },
  ESCALATED: {
    label: 'ESCALATED',
    citizenLabel: 'Escalated to Supervisor',
    bg: 'bg-red-950/80',
    text: 'text-red-300',
    border: 'border-red-600',
    icon: TrendingUp
  },
  RESOLVED: {
    label: 'RESOLVED',
    citizenLabel: 'Resolved',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-600/70',
    icon: CheckCircle2
  },
  CLOSED: {
    label: 'CLOSED',
    citizenLabel: 'Closed',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: CheckCircle2
  },
  DUPLICATE: {
    label: 'DUPLICATE',
    citizenLabel: 'Linked to Existing',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: Clock
  },
  REJECTED: {
    label: 'REJECTED',
    citizenLabel: 'Declined',
    bg: 'bg-rose-950/50',
    text: 'text-rose-400',
    border: 'border-rose-800',
    icon: XCircle
  }
};

interface StatusBadgeProps {
  status: ComplaintStatus;
  mode?: 'citizen' | 'government';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  mode = 'government',
  size = 'md' 
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const Icon = config.icon;
  const text = mode === 'citizen' ? config.citizenLabel : config.label;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-md border whitespace-nowrap shrink-0 ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{text}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'md',
  showIcon = true 
}) => {
  const config: Record<PriorityLevel, { bg: string; text: string; border: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    CRITICAL: {
      bg: 'bg-red-950/80',
      text: 'text-red-300',
      border: 'border-red-600',
      label: 'CRITICAL',
      icon: ShieldAlert
    },
    HIGH: {
      bg: 'bg-amber-950/70',
      text: 'text-amber-300',
      border: 'border-amber-600/70',
      label: 'HIGH',
      icon: AlertTriangle
    },
    MEDIUM: {
      bg: 'bg-yellow-950/60',
      text: 'text-yellow-300',
      border: 'border-yellow-700/60',
      label: 'MEDIUM',
      icon: Clock
    },
    LOW: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-800/60',
      label: 'LOW',
      icon: CheckCircle2
    }
  };

  const current = config[priority] || config.MEDIUM;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1 font-bold tracking-wider',
    md: 'px-2.5 py-0.5 text-xs gap-1.5 font-bold tracking-wider',
    lg: 'px-3 py-1 text-sm gap-2 font-bold tracking-wider'
  }[size];

  return (
    <span className={`inline-flex items-center rounded border whitespace-nowrap shrink-0 ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      <span>{current.label}</span>
    </span>
  );
};

export const SlaBadge: React.FC<{ slaStatus: SlaStatus; hoursLeft?: number }> = ({ slaStatus, hoursLeft }) => {
  if (slaStatus === 'OVERDUE') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-950/80 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-600 whitespace-nowrap shrink-0">
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        <span>SLA BREACHED</span>
      </span>
    );
  }
  if (slaStatus === 'DUE_SOON') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-950/70 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-600/70 whitespace-nowrap shrink-0">
        <Clock className="w-3 h-3 text-amber-400" />
        <span>DUE SOON</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-800/60 whitespace-nowrap shrink-0">
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      <span>ON TRACK</span>
    </span>
  );
};

export const AIVerificationBadge: React.FC<{ result?: AIVerificationResult; score?: number }> = ({ result, score }) => {
  if (!result) return null;

  const map: Record<AIVerificationResult, { bg: string; text: string; border: string; label: string }> = {
    MATCHED: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-600',
      label: 'AI MATCHED (95%+)'
    },
    LIKELY_RESOLVED: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-600',
      label: `AI LIKELY RESOLVED (${score || 90}%)`
    },
    LIKELY_MATCH: {
      bg: 'bg-teal-950/80',
      text: 'text-teal-300',
      border: 'border-teal-600/70',
      label: `AI LIKELY MATCH (${score || 91}%)`
    },
    POSSIBLY_RESOLVED: {
      bg: 'bg-cyan-950/80',
      text: 'text-cyan-300',
      border: 'border-cyan-600/70',
      label: `AI POSSIBLY RESOLVED (${score || 75}%)`
    },
    UNCERTAIN: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-600',
      label: `AI UNCERTAIN (${score || 64}%)`
    },
    NOT_RESOLVED: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-600',
      label: 'AI NOT RESOLVED'
    },
    MISMATCH: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-600',
      label: 'AI MISMATCH DETECTED'
    },
    INSUFFICIENT_EVIDENCE: {
      bg: 'bg-slate-900',
      text: 'text-slate-400',
      border: 'border-slate-700',
      label: 'INSUFFICIENT PROOF'
    }
  };

  const item = map[result];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-semibold border whitespace-nowrap shrink-0 ${item.bg} ${item.text} ${item.border}`}>
      <Sparkles className="w-3 h-3" />
      <span>{item.label}</span>
    </span>
  );
};
