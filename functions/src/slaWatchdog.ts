/**
 * Firebase Cloud Function: Automated SLA Breach Watchdog & Notification Trigger
 * 
 * Monitored Conditions:
 * - Status remains 'OPEN', 'NEW', or 'ASSIGNED' (or active) after calculated 'slaDeadline' timestamp has passed.
 * 
 * Actions Triggered:
 * 1. Dispatches high-priority alert notification to Department Supervisor.
 * 2. Dispatches executive alert notification to Super Admin (Main Head / Municipal Commissioner).
 * 3. Dispatches task overdue warning to assigned Field Officer (if assigned).
 * 4. Updates complaint Firestore document with `slaStatus: 'OVERDUE'`, `slaBreachedAt: Timestamp.now()`.
 * 5. Registers an entry in Firestore `triggers` collection for city-wide incident heatmaps.
 * 6. Appends immutable event to `audit_logs` collection.
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin SDK if not initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled Cloud Function: Runs periodically (e.g. every 5 minutes) to scan for complaints
 * whose status remains 'OPEN', 'NEW', or 'ASSIGNED' past their `slaDeadline`.
 */
export const checkSlaBreachWatchdogCron = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Kolkata',
    retryCount: 3,
    memory: '256MiB'
  },
  async (event) => {
    logger.info('Starting SEVA Automated SLA Breach Watchdog scheduled scan...', { timestamp: event.scheduleTime });
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    try {
      // Query active complaints that are still in unresolved states
      // (Handles 'OPEN', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CITIZEN_EVIDENCE')
      const activeStatuses = ['OPEN', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CITIZEN_EVIDENCE'];
      const snapshot = await db.collection('complaints')
        .where('status', 'in', activeStatuses)
        .get();

      if (snapshot.empty) {
        logger.info('No active complaints found during SLA watchdog scan.');
        return;
      }

      const batch = db.batch();
      let breachedCount = 0;
      const notifiedComplaints: Array<{ id: string; token: string; department: string; hoursOverdue: number }> = [];

      for (const doc of snapshot.docs) {
        const complaint = doc.data();
        const deadline = complaint.slaDeadline;
        
        let deadlineMs = 0;
        if (deadline && typeof deadline.toMillis === 'function') {
          deadlineMs = deadline.toMillis();
        } else if (typeof deadline === 'string') {
          deadlineMs = new Date(deadline).getTime();
        } else if (typeof deadline === 'number') {
          deadlineMs = deadline;
        }

        // If current time exceeds calculated slaDeadline
        if (deadlineMs > 0 && nowMs > deadlineMs) {
          const hoursOverdue = Math.max(1, Math.round((nowMs - deadlineMs) / (3600 * 1000)));
          breachedCount++;

          const complaintId = doc.id;
          const token = complaint.token || `SEVA-${complaintId.slice(0, 6).toUpperCase()}`;
          const departmentName = complaint.departmentName || 'Civic Department';
          const departmentId = complaint.departmentId || 'dept-general';
          const title = complaint.title || 'Civic Grievance';
          const assignedOfficerId = complaint.assignedOfficerId;
          const assignedOfficerName = complaint.assignedOfficerName;

          // Check if this breach was already notified in notifications collection
          const existingNotifQuery = await db.collection('notifications')
            .where('ticketId', '==', complaintId)
            .where('type', '==', 'ALERT')
            .where('title', '>=', '🚨 SLA BREACH')
            .limit(1)
            .get();

          if (existingNotifQuery.empty) {
            notifiedComplaints.push({ id: complaintId, token, department: departmentName, hoursOverdue });

            // 1. Notification for Department Supervisor
            const supervisorNotifRef = db.collection('notifications').doc();
            batch.set(supervisorNotifRef, {
              recipientRole: 'SUPERVISOR',
              departmentId: departmentId,
              title: `🚨 SLA BREACH: ${token} (${departmentName})`,
              message: `Grievance "${title}" remains in ${complaint.status} status and is overdue by ${hoursOverdue}h. Immediate supervisor intervention required.`,
              type: 'ALERT',
              ticketId: complaintId,
              ticketToken: token,
              createdAt: now,
              read: false,
              actionUrl: `/government/complaints/${complaintId}`,
              source: 'FIREBASE_CLOUD_FUNCTION_SLA_WATCHDOG'
            });

            // 2. Notification for Super Admin (Municipal Chief Administrator / Main Head)
            const adminNotifRef = db.collection('notifications').doc();
            batch.set(adminNotifRef, {
              recipientRole: 'ADMIN',
              recipientId: 'gov-admin',
              title: `🚨 EXECUTIVE SLA BREACH: ${token}`,
              message: `Department ${departmentName} breached SLA timeline on "${title}". Overdue by ${hoursOverdue}h. Status remains '${complaint.status}'.`,
              type: 'ALERT',
              ticketId: complaintId,
              ticketToken: token,
              createdAt: now,
              read: false,
              actionUrl: `/government/complaints/${complaintId}`,
              source: 'FIREBASE_CLOUD_FUNCTION_SLA_WATCHDOG'
            });

            // 3. Notification for Assigned Field Officer (if assigned)
            if (assignedOfficerId) {
              const officerNotifRef = db.collection('notifications').doc();
              batch.set(officerNotifRef, {
                recipientRole: 'OFFICER',
                recipientId: assignedOfficerId,
                title: `⚠️ SLA OVERDUE WARNING: ${token}`,
                message: `Your assigned task "${title}" has exceeded resolution deadline (${hoursOverdue}h overdue). Expedite work immediately.`,
                type: 'ALERT',
                ticketId: complaintId,
                ticketToken: token,
                createdAt: now,
                read: false,
                actionUrl: `/government/complaints/${complaintId}`,
                source: 'FIREBASE_CLOUD_FUNCTION_SLA_WATCHDOG'
              });
            }

            // 4. Update Complaint Document status & overdue timestamps
            const complaintRef = db.collection('complaints').doc(complaintId);
            batch.update(complaintRef, {
              slaStatus: 'OVERDUE',
              slaBreachedAt: now,
              hoursOverdue: hoursOverdue,
              updatedAt: now,
              watchdogLastScannedAt: now
            });

            // 5. Insert Trigger Record for Command Center Hotspot Maps
            const triggerRef = db.collection('triggers').doc();
            batch.set(triggerRef, {
              triggerType: 'SLA_BREACH',
              ticketId: complaintId,
              ticketToken: token,
              title: `SLA Breach (${hoursOverdue}h Overdue): ${title}`,
              area: complaint.location?.area || 'Chennai Central',
              departmentName: departmentName,
              departmentId: departmentId,
              priority: complaint.priority || 'HIGH',
              riskScore: complaint.riskScore || 85,
              status: 'ACTIVE',
              actionRequired: `Supervisor escalation & immediate crew re-dispatch for ${token}`,
              triggeredAt: now,
              source: 'FIREBASE_CLOUD_FUNCTION'
            });

            // 6. Audit Trail Entry
            const auditRef = db.collection('audit_logs').doc();
            batch.set(auditRef, {
              userId: 'system-sla-watchdog',
              userName: 'Firebase Cloud Function Watchdog',
              role: 'SYSTEM',
              action: 'SLA_BREACH_TRIGGERED',
              entityType: 'COMPLAINT',
              entityId: token,
              details: `Automated SLA breach alert dispatched to Department Supervisor & Super Admin (${hoursOverdue}h overdue, status: ${complaint.status}).`,
              timestamp: now
            });
          }
        }
      }

      if (notifiedComplaints.length > 0) {
        await batch.commit();
        logger.info(`SLA Watchdog scan complete. Triggered notifications for ${notifiedComplaints.length} overdue complaints:`, notifiedComplaints);
      } else {
        logger.info(`SLA Watchdog scan complete. Scanned ${snapshot.size} active records; no new breaches required notification.`);
      }
    } catch (error) {
      logger.error('Error in checkSlaBreachWatchdogCron Cloud Function:', error);
      throw error;
    }
  }
);

/**
 * Firestore Document Update Trigger: Whenever a complaint document is updated,
 * check if its status remains 'OPEN', 'NEW', or 'ASSIGNED' after `slaDeadline` has passed.
 */
export const onComplaintUpdatedSlaCheck = onDocumentUpdated('complaints/{complaintId}', async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!afterData) return;

  const activeStatuses = ['OPEN', 'NEW', 'ASSIGNED', 'IN_PROGRESS'];
  if (!activeStatuses.includes(afterData.status)) {
    return;
  }

  const nowMs = Date.now();
  const deadline = afterData.slaDeadline;
  let deadlineMs = 0;
  if (deadline && typeof deadline.toMillis === 'function') {
    deadlineMs = deadline.toMillis();
  } else if (typeof deadline === 'string') {
    deadlineMs = new Date(deadline).getTime();
  }

  if (deadlineMs > 0 && nowMs > deadlineMs && afterData.slaStatus !== 'OVERDUE') {
    const complaintId = event.params.complaintId;
    const token = afterData.token || complaintId;
    const hoursOverdue = Math.max(1, Math.round((nowMs - deadlineMs) / (3600 * 1000)));

    logger.warn(`Complaint ${token} updated with status '${afterData.status}' after slaDeadline has passed (${hoursOverdue}h overdue). Dispatching alerts.`);

    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();

    // Supervisor Notification
    const supRef = db.collection('notifications').doc();
    batch.set(supRef, {
      recipientRole: 'SUPERVISOR',
      departmentId: afterData.departmentId,
      title: `🚨 SLA BREACH: ${token} (${afterData.departmentName})`,
      message: `Grievance "${afterData.title}" status remains '${afterData.status}' past deadline (${hoursOverdue}h overdue).`,
      type: 'ALERT',
      ticketId: complaintId,
      ticketToken: token,
      createdAt: now,
      read: false,
      actionUrl: `/government/complaints/${complaintId}`
    });

    // Super Admin Notification
    const adminRef = db.collection('notifications').doc();
    batch.set(adminRef, {
      recipientRole: 'ADMIN',
      recipientId: 'gov-admin',
      title: `🚨 EXECUTIVE SLA BREACH: ${token}`,
      message: `Overdue Complaint: ${afterData.departmentName} - "${afterData.title}" (${hoursOverdue}h overdue). Status: '${afterData.status}'.`,
      type: 'ALERT',
      ticketId: complaintId,
      ticketToken: token,
      createdAt: now,
      read: false,
      actionUrl: `/government/complaints/${complaintId}`
    });

    // Mark as overdue
    const compRef = db.collection('complaints').doc(complaintId);
    batch.update(compRef, {
      slaStatus: 'OVERDUE',
      slaBreachedAt: now
    });

    await batch.commit();
  }
});
