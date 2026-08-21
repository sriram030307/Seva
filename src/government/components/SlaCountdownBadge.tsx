import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { calculateSlaInfo, getSlaSeverityStyles, SlaCountdownInfo } from '../../utils/slaUtils';
import { Clock, Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SlaCountdownBadgeProps {
  complaint: Complaint;
  showDetails?: boolean;
}

export const SlaCountdownBadge: React.FC<SlaCountdownBadgeProps> = ({ 
  complaint, 
  showDetails = true 
}) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slaInfo: SlaCountdownInfo = calculateSlaInfo(complaint, currentTime);
  const styles = getSlaSeverityStyles(slaInfo.severity);
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  return (
    <div className="flex flex-col gap-1 items-start">
      <div 
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}
      >
        {slaInfo.isBreached ? (
          <Flame className={`w-3 h-3 ${styles.iconColor} animate-pulse`} />
        ) : slaInfo.isCriticalWarning ? (
          <AlertTriangle className={`w-3 h-3 ${styles.iconColor} animate-pulse`} />
        ) : isResolved ? (
          <CheckCircle2 className={`w-3 h-3 ${styles.iconColor}`} />
        ) : (
          <Clock className={`w-3 h-3 ${styles.iconColor}`} />
        )}

        <span>{slaInfo.formattedCountdown}</span>
      </div>

      {showDetails && (
        <span className="text-[9px] font-mono text-slate-500 line-clamp-1">
          {slaInfo.timeRemainingLabel}
        </span>
      )}
    </div>
  );
};
