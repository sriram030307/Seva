import { sevaStore } from './store';
import { Complaint, AppNotification } from '../types';

export interface CloudFunctionExecutionLog {
  id: string;
  functionName: string;
  triggerType: 'SCHEDULED_CRON' | 'MANUAL_OVERRIDE' | 'DOCUMENT_MUTATION';
  timestamp: string;
  scannedCount: number;
  breachedCount: number;
  notifiedTokens: string[];
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details: string;
  notificationsDispatched: Array<{
    role: string;
    target: string;
    title: string;
  }>;
}

class FirebaseCloudFunctionsService {
  private executionLogs: CloudFunctionExecutionLog[] = [];
  private listeners: Set<() => void> = new Set();
  private autoSchedulerTimer: number | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initInitialLogs();
    this.startScheduler();
  }

  private initInitialLogs() {
    this.executionLogs = [
      {
        id: `cfl-init-1`,
        functionName: 'checkSlaBreachWatchdogCron',
        triggerType: 'SCHEDULED_CRON',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        scannedCount: 18,
        breachedCount: 3,
        notifiedTokens: ['ROAD-2026-000104', 'WAT-2026-000219'],
        status: 'SUCCESS',
        details: 'Scanned 18 active records; 3 exceeded slaDeadline. Dispatched alerts to Dept Supervisors & Super Admin.',
        notificationsDispatched: [
          { role: 'SUPERVISOR', target: 'Roads & Bridges', title: '🚨 SLA BREACH: ROAD-2026-000104' },
          { role: 'ADMIN', target: 'K. Rajasekaran, IAS', title: '🚨 EXECUTIVE SLA BREACH: ROAD-2026-000104' }
        ]
      },
      {
        id: `cfl-init-2`,
        functionName: 'checkSlaBreachWatchdogCron',
        triggerType: 'SCHEDULED_CRON',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        scannedCount: 18,
        breachedCount: 3,
        notifiedTokens: ['WAT-2026-000219'],
        status: 'SUCCESS',
        details: 'Automated 5-min watchdog heartbeat. 3 breached complaints verified, notifications persistent.',
        notificationsDispatched: [
          { role: 'SUPERVISOR', target: 'Water Supply', title: '🚨 SLA BREACH: WAT-2026-000219' },
          { role: 'ADMIN', target: 'K. Rajasekaran, IAS', title: '🚨 EXECUTIVE SLA BREACH: WAT-2026-000219' }
        ]
      }
    ];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try { l(); } catch (e) { console.error(e); }
    });
  }

  public getExecutionLogs(): CloudFunctionExecutionLog[] {
    return [...this.executionLogs];
  }

  public startScheduler() {
    if (typeof window === 'undefined') return;
    if (this.autoSchedulerTimer) window.clearInterval(this.autoSchedulerTimer);

    // Run every 30 seconds for live UI feedback
    this.autoSchedulerTimer = window.setInterval(() => {
      if (this.isEnabled) {
        this.executeSlaWatchdog('SCHEDULED_CRON');
      }
    }, 30000);
  }

  public toggleScheduler(enabled: boolean) {
    this.isEnabled = enabled;
    this.notify();
  }

  public isSchedulerEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Execute the Cloud Function Watchdog on demand or via cron
   */
  public executeSlaWatchdog(triggerType: 'SCHEDULED_CRON' | 'MANUAL_OVERRIDE' | 'DOCUMENT_MUTATION' = 'MANUAL_OVERRIDE'): CloudFunctionExecutionLog {
    const complaints = sevaStore.getComplaints();
    const nowMs = Date.now();
    const activeStatuses = ['OPEN', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CITIZEN_EVIDENCE'];
    
    const activeComplaints = complaints.filter(c => 
      activeStatuses.includes(c.status) && c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED'
    );

    let breachedCount = 0;
    const notifiedTokens: string[] = [];
    const notificationsDispatched: Array<{ role: string; target: string; title: string }> = [];

    activeComplaints.forEach((comp) => {
      const deadlineMs = new Date(comp.slaDeadline).getTime();
      
      if (nowMs > deadlineMs) {
        breachedCount++;
        const hoursOverdue = Math.max(1, Math.round((nowMs - deadlineMs) / (3600 * 1000)));
        notifiedTokens.push(comp.token);

        notificationsDispatched.push({
          role: 'SUPERVISOR',
          target: comp.departmentName,
          title: `🚨 SLA BREACH: ${comp.token} (${comp.departmentName})`
        });

        notificationsDispatched.push({
          role: 'ADMIN',
          target: 'K. Rajasekaran, IAS (Main Head)',
          title: `🚨 EXECUTIVE SLA BREACH: ${comp.token}`
        });

        if (comp.assignedOfficerName) {
          notificationsDispatched.push({
            role: 'OFFICER',
            target: comp.assignedOfficerName,
            title: `⚠️ SLA OVERDUE: ${comp.token}`
          });
        }
      }
    });

    // Run store-level watchdog sync
    const res = sevaStore.checkAndTriggerSlaBreaches();

    const newLog: CloudFunctionExecutionLog = {
      id: `cfl-${Date.now()}`,
      functionName: 'checkSlaBreachWatchdogCron',
      triggerType: triggerType,
      timestamp: new Date().toISOString(),
      scannedCount: activeComplaints.length,
      breachedCount: breachedCount,
      notifiedTokens: notifiedTokens.slice(0, 5),
      status: breachedCount > 0 ? 'WARNING' : 'SUCCESS',
      details: breachedCount > 0 
        ? `Detected ${breachedCount} grievance(s) with status 'OPEN'/'ASSIGNED' beyond slaDeadline. Cloud Function triggered Supervisor & Admin alerts.`
        : `All ${activeComplaints.length} active grievances are within calculated SLA deadlines. 0 breaches.`,
      notificationsDispatched: notificationsDispatched.slice(0, 6)
    };

    this.executionLogs.unshift(newLog);
    if (this.executionLogs.length > 25) {
      this.executionLogs.pop();
    }

    this.notify();
    return newLog;
  }

  /**
   * Helper to simulate an overdue breach for testing
   */
  public simulateBreachOnTicket(ticketId: string): void {
    const comp = sevaStore.getComplaintById(ticketId);
    if (!comp) return;

    // Set deadline to 6 hours ago
    const pastDeadline = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    comp.slaDeadline = pastDeadline;
    comp.slaStatus = 'OVERDUE';
    comp.status = 'ASSIGNED';

    // Trigger Cloud Function immediately
    this.executeSlaWatchdog('DOCUMENT_MUTATION');
  }
}

export const firebaseCloudFunctionsService = new FirebaseCloudFunctionsService();
