import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  isFirebaseConfigured
} from './firebase';
import { 
  MAIN_ADMIN_USER, 
  SEVA_18_DEPARTMENTS, 
  DEPARTMENT_ADMIN_USERS, 
  DEPARTMENT_OFFICERS, 
  DEMO_CITIZEN_USERS 
} from './organizationData';
import { generateSeedComplaints } from './mockData';

export class FirebaseSeedService {
  private isSeeded = false;

  /**
   * Automatically initializes and seeds Firestore collections if not already seeded
   */
  public async seedInitialDataIfNeeded(): Promise<boolean> {
    if (!isFirebaseConfigured() || !db) {
      console.info('Firebase Firestore credentials not detected. Operating in hybrid memory/resilient mode.');
      return false;
    }

    if (this.isSeeded) return true;

    try {
      // 1. Seed Main Administrator (Sriram Venkatesan)
      const adminRef = doc(db, 'users', MAIN_ADMIN_USER.id);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        console.log('Seeding Primary Administrator:', MAIN_ADMIN_USER.name);
        await setDoc(adminRef, {
          uid: MAIN_ADMIN_USER.id,
          name: MAIN_ADMIN_USER.name,
          email: MAIN_ADMIN_USER.email,
          phone: MAIN_ADMIN_USER.phone,
          role: MAIN_ADMIN_USER.role,
          departmentId: 'ALL',
          departmentName: 'ALL DEPARTMENTS',
          badgeNumber: MAIN_ADMIN_USER.badgeNumber,
          area: MAIN_ADMIN_USER.area,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Seed 18 Departments
      for (const dept of SEVA_18_DEPARTMENTS) {
        const deptRef = doc(db, 'departments', dept.id);
        const deptSnap = await getDoc(deptRef);
        if (!deptSnap.exists()) {
          await setDoc(deptRef, {
            id: dept.id,
            code: dept.code,
            name: dept.name,
            tamilName: dept.tamilName || '',
            description: `Handles civic services and grievances under ${dept.name}`,
            categories: [dept.code, `${dept.code}_MAINTENANCE`, `${dept.code}_URGENT`],
            slaHours: dept.defaultSlaHours,
            officerCount: dept.officerCount,
            activeCases: dept.activeCases,
            resolvedCases: dept.resolvedCases,
            contactEmail: dept.contactEmail,
            contactPhone: dept.contactHelpline,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 3. Seed Department Admins
      for (const deptAdmin of DEPARTMENT_ADMIN_USERS) {
        const userRef = doc(db, 'users', deptAdmin.id);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: deptAdmin.id,
            name: deptAdmin.name,
            email: deptAdmin.email,
            phone: deptAdmin.phone,
            role: deptAdmin.role,
            departmentId: deptAdmin.departmentId,
            departmentName: deptAdmin.departmentName,
            badgeNumber: deptAdmin.badgeNumber,
            area: deptAdmin.area,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 4. Seed Department Officers
      for (const off of DEPARTMENT_OFFICERS) {
        const offRef = doc(db, 'officers', off.id);
        const snap = await getDoc(offRef);
        if (!snap.exists()) {
          await setDoc(offRef, {
            id: off.id,
            userId: `usr_${off.id}`,
            name: off.name,
            email: off.email,
            phone: off.phone,
            departmentId: off.departmentId,
            departmentName: off.departmentName,
            role: off.role,
            designation: 'Senior Municipal Engineer / Inspector',
            badgeNumber: off.badge,
            isActive: true,
            currentWorkload: off.activeAssignments,
            resolvedCases: off.resolvedCases,
            rating: off.rating,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 5. Seed Citizens
      for (const cit of DEMO_CITIZEN_USERS) {
        const citRef = doc(db, 'citizens', cit.id);
        const snap = await getDoc(citRef);
        if (!snap.exists()) {
          await setDoc(citRef, {
            citizenId: cit.id,
            uid: cit.id,
            name: cit.name,
            email: cit.email,
            phone: cit.phone || '',
            area: cit.area || '',
            preferredLanguage: cit.preferredLanguage || 'ta',
            totalReportsSubmitted: 3,
            activeReportsCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 6. Seed Baseline Complaints
      const seedComplaints = generateSeedComplaints();
      for (const comp of seedComplaints.slice(0, 10)) {
        const compRef = doc(db, 'complaints', comp.id);
        const snap = await getDoc(compRef);
        if (!snap.exists()) {
          await setDoc(compRef, {
            ...comp,
            latitude: comp.location.latitude,
            longitude: comp.location.longitude,
            address: comp.location.address,
            area: comp.location.area,
            city: comp.location.city,
            state: comp.location.state,
            createdAt: comp.createdAt,
            updatedAt: comp.updatedAt
          });
        }
      }

      this.isSeeded = true;
      console.log('SEVA Firebase Initial Data Seeded successfully.');
      return true;
    } catch (error) {
      console.warn('Firebase seeding caught exception:', error);
      return false;
    }
  }
}

export const firebaseSeedService = new FirebaseSeedService();
