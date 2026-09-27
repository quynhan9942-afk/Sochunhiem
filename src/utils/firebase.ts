import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, UserCredential } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ClassConfig, Student } from '../types';

const env = (import.meta as any).env || {};

// Firebase configuration using official project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAriGnWDfEEbRJSzNG66oK7pNQ5dj_08M",
  authDomain: "so-chu-nhiem-dien-tu-9eaed.firebaseapp.com",
  projectId: "so-chu-nhiem-dien-tu-9eaed",
  storageBucket: "so-chu-nhiem-dien-tu-9eaed.firebasestorage.app",
  messagingSenderId: "358382190291",
  appId: "1:358382190291:web:08e3c42dd723960a039e26",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Helper to save class data directly to cloud document `classes/lop_6a3`
 */
export async function saveClassDataToCloud(data: any): Promise<boolean> {
  try {
    const payload = {
      ...data,
      className: data?.config?.className || '6a3',
      schoolName: data?.config?.schoolName || 'THCS Nguyễn Văn Cừ',
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to classes/lop_6a3
    const docRefClassLop6a3 = doc(db, 'classes', 'lop_6a3');
    await setDoc(docRefClassLop6a3, payload, { merge: true });

    // 2. Save to classes/6a3_nguyenvancu
    const docRefClassAlias = doc(db, 'classes', '6a3_nguyenvancu');
    await setDoc(docRefClassAlias, payload, { merge: true });

    // 3. Save to users data
    await saveUserDataToFirestore('quynhan9942@gmail.com', payload);
    return true;
  } catch (err) {
    console.warn('saveClassDataToCloud error:', err);
    return false;
  }
}

/**
 * Loads user data from Firestore document `classes/lop_6a3`, `classes/6a3_nguyenvancu`, `classes/{user_email}`, `users/{user_email}/data/main`
 */
export async function loadUserDataFromFirestore(userEmail: string): Promise<any | null> {
  if (!userEmail) return null;
  const cleanEmail = userEmail.trim().toLowerCase();
  const rawEmail = userEmail.trim();

  try {
    let result: any = null;

    // 0. Try fixed document: classes/lop_6a3
    const docRefClassLop6a3 = doc(db, 'classes', 'lop_6a3');
    const docSnapClassLop6a3 = await getDoc(docRefClassLop6a3);
    if (docSnapClassLop6a3.exists()) {
      result = docSnapClassLop6a3.data();
    } else {
      // 0b. Try document: classes/6a3_nguyenvancu
      const docRefClassAlias = doc(db, 'classes', '6a3_nguyenvancu');
      const docSnapClassAlias = await getDoc(docRefClassAlias);
      if (docSnapClassAlias.exists()) {
        result = docSnapClassAlias.data();
      }
    }

    if (!result) {
      // 1. Try document: classes/{cleanEmail}
      const docRefClassClean = doc(db, 'classes', cleanEmail);
      const docSnapClassClean = await getDoc(docRefClassClean);
      if (docSnapClassClean.exists()) {
        result = docSnapClassClean.data();
      } else {
        // 1b. Try document: classes/{rawEmail}
        const docRefClassRaw = doc(db, 'classes', rawEmail);
        const docSnapClassRaw = await getDoc(docRefClassRaw);
        if (docSnapClassRaw.exists()) {
          result = docSnapClassRaw.data();
        } else {
          // 2. Try document: users/{cleanEmail}/data/main
          const docRefDataMain = doc(db, 'users', cleanEmail, 'data', 'main');
          const docSnapDataMain = await getDoc(docRefDataMain);
          if (docSnapDataMain.exists()) {
            result = docSnapDataMain.data();
          } else {
            // 3. Try document: users/{cleanEmail}/data
            const docRefDataDirect = doc(db, 'users', cleanEmail, 'data');
            const docSnapDataDirect = await getDoc(docRefDataDirect);
            if (docSnapDataDirect.exists()) {
              result = docSnapDataDirect.data();
            } else {
              // 4. Try document: users/{cleanEmail}
              const docRefDirect = doc(db, 'users', cleanEmail);
              const docSnapDirect = await getDoc(docRefDirect);
              if (docSnapDirect.exists()) {
                result = docSnapDirect.data();
              }
            }
          }
        }
      }
    }

    // Also check dedicated rules doc: users/{cleanEmail}/rules/main or users/{cleanEmail}/rules
    try {
      const docRefRulesMain = doc(db, 'users', cleanEmail, 'rules', 'main');
      const docSnapRulesMain = await getDoc(docRefRulesMain);
      if (docSnapRulesMain.exists()) {
        const rulesData = docSnapRulesMain.data();
        if (rulesData && rulesData.classRulesConfig) {
          result = result || {};
          result.classRulesConfig = rulesData.classRulesConfig;
        }
      } else {
        const docRefRulesDirect = doc(db, 'users', cleanEmail, 'rules');
        const docSnapRulesDirect = await getDoc(docRefRulesDirect);
        if (docSnapRulesDirect.exists()) {
          const rulesData = docSnapRulesDirect.data();
          if (rulesData && rulesData.classRulesConfig) {
            result = result || {};
            result.classRulesConfig = rulesData.classRulesConfig;
          }
        }
      }
    } catch (re) {
      console.warn('Error loading dedicated rules doc:', re);
    }

    // Also check dedicated settings doc: users/{cleanEmail}/settings/main or users/{cleanEmail}/settings
    try {
      const docRefSettingsMain = doc(db, 'users', cleanEmail, 'settings', 'main');
      const docSnapSettingsMain = await getDoc(docRefSettingsMain);
      if (docSnapSettingsMain.exists()) {
        const settingsData = docSnapSettingsMain.data();
        if (settingsData) {
          result = result || {};
          if (settingsData.periodConfig && !result.periodConfig) result.periodConfig = settingsData.periodConfig;
          if (settingsData.config && !result.config) result.config = settingsData.config;
          if (settingsData.operatingDate && !result.operatingDate) result.operatingDate = settingsData.operatingDate;
        }
      }
    } catch (se) {
      console.warn('Error loading dedicated settings doc:', se);
    }

    return result;
  } catch (e) {
    console.warn('Error loading user data from Firestore:', e);
    return null;
  }
}

/**
 * Saves user data to Firestore documents `classes/{user_email}`, `users/{user_email}/data`, `users/{user_email}/data/main`, `users/{user_email}`
 */
export async function saveUserDataToFirestore(userEmail: string, data: any): Promise<boolean> {
  if (!userEmail) return false;
  const cleanEmail = userEmail.trim().toLowerCase();
  const rawEmail = userEmail.trim();

  try {
    const payload = {
      ...data,
      userEmail: cleanEmail,
      adminId: cleanEmail,
      updatedAt: new Date().toISOString(),
    };

    // Save to classes/lop_6a3 as primary class doc
    const docRefClassLop6a3 = doc(db, 'classes', 'lop_6a3');
    await setDoc(docRefClassLop6a3, payload, { merge: true });

    // Save to classes/{cleanEmail}
    const docRefClassClean = doc(db, 'classes', cleanEmail);
    await setDoc(docRefClassClean, payload, { merge: true });

    if (rawEmail !== cleanEmail) {
      const docRefClassRaw = doc(db, 'classes', rawEmail);
      await setDoc(docRefClassRaw, payload, { merge: true });
    }

    // Save to classes/6a3_nguyenvancu as alias
    const docRefClassAlias = doc(db, 'classes', '6a3_nguyenvancu');
    await setDoc(docRefClassAlias, payload, { merge: true });

    // Save to users/{cleanEmail}/data/main
    const docRefDataMain = doc(db, 'users', cleanEmail, 'data', 'main');
    await setDoc(docRefDataMain, payload, { merge: true });

    // Save to users/{cleanEmail}/data
    const docRefDataDirect = doc(db, 'users', cleanEmail, 'data');
    await setDoc(docRefDataDirect, payload, { merge: true });

    // Save to users/{cleanEmail}
    const docRefDirect = doc(db, 'users', cleanEmail);
    await setDoc(docRefDirect, payload, { merge: true });

    // Save dedicated rules doc if classRulesConfig is present
    if (data.classRulesConfig) {
      const docRefRulesMain = doc(db, 'users', cleanEmail, 'rules', 'main');
      await setDoc(docRefRulesMain, {
        classRulesConfig: data.classRulesConfig,
        userEmail: cleanEmail,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const docRefRulesDirect = doc(db, 'users', cleanEmail, 'rules');
      await setDoc(docRefRulesDirect, {
        classRulesConfig: data.classRulesConfig,
        userEmail: cleanEmail,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Save dedicated settings doc if config or periodConfig is present
    if (data.config || data.periodConfig || data.operatingDate) {
      const docRefSettingsMain = doc(db, 'users', cleanEmail, 'settings', 'main');
      await setDoc(docRefSettingsMain, {
        config: data.config,
        periodConfig: data.periodConfig,
        operatingDate: data.operatingDate,
        userEmail: cleanEmail,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const docRefSettingsDirect = doc(db, 'users', cleanEmail, 'settings');
      await setDoc(docRefSettingsDirect, {
        config: data.config,
        periodConfig: data.periodConfig,
        operatingDate: data.operatingDate,
        userEmail: cleanEmail,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    return true;
  } catch (e) {
    console.warn('Error saving user data to Firestore:', e);
    return false;
  }
}

/**
 * Subscribes in real-time using Firestore `onSnapshot` to automatically update
 * client data whenever Admin saves changes on Firestore.
 */
export function subscribeToUserDataInFirestore(
  userEmail: string,
  onDataUpdate: (data: any) => void
): () => void {
  if (!userEmail) return () => {};
  const cleanEmail = userEmail.trim().toLowerCase();

  const docRefClassLop6a3 = doc(db, 'classes', 'lop_6a3');
  const docRefClassClean = doc(db, 'classes', cleanEmail);
  const docRefClassAlias = doc(db, 'classes', '6a3_nguyenvancu');
  const docRefDataMain = doc(db, 'users', cleanEmail, 'data', 'main');

  const unsubs: Array<() => void> = [];

  // Listen on classes/lop_6a3
  const unsubLop6a3 = onSnapshot(docRefClassLop6a3, (docSnap) => {
    if (docSnap.exists()) {
      onDataUpdate(docSnap.data());
    }
  }, (err) => {
    console.warn('Realtime listener error on lop_6a3:', err);
  });
  unsubs.push(unsubLop6a3);

  // Listen on classes/{cleanEmail}
  const unsubClean = onSnapshot(docRefClassClean, (docSnap) => {
    if (docSnap.exists()) {
      onDataUpdate(docSnap.data());
    }
  }, (err) => {
    console.warn('Realtime listener error:', err);
  });
  unsubs.push(unsubClean);

  // Listen on classes/6a3_nguyenvancu as fallback alias
  if (cleanEmail !== '6a3_nguyenvancu') {
    const unsubAlias = onSnapshot(docRefClassAlias, (docSnap) => {
      if (docSnap.exists()) {
        onDataUpdate(docSnap.data());
      }
    }, (err) => {
      console.warn('Realtime listener error on alias:', err);
    });
    unsubs.push(unsubAlias);
  }

  // Listen on users/{cleanEmail}/data/main
  const unsubMain = onSnapshot(docRefDataMain, (docSnap) => {
    if (docSnap.exists()) {
      onDataUpdate(docSnap.data());
    }
  }, (err) => {
    console.warn('Realtime listener error on users data:', err);
  });
  unsubs.push(unsubMain);

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}

export async function loginWithGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Giáo viên',
      photoURL: user.photoURL || '',
    };
  } catch (error: any) {
    console.warn('Firebase loginWithGoogle error:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error('Error signing out:', e);
  }
}

export async function saveClassConfigToCloud(config: ClassConfig): Promise<boolean> {
  try {
    if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      return false; // Skip network call if demo mode
    }
    const classId = config.className || '6a3';
    const schoolYearId = (config.schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${schoolYearId}_${classId}`;
    const docRef = doc(db, 'classConfigs', docId);
    
    await setDoc(docRef, {
      ...config,
      schoolId: config.schoolId || 'THCS_NVC',
      classId,
      schoolYearId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save error:', err);
    return false;
  }
}

export async function saveStudentToCloud(
  student: Student,
  schoolYear: string,
  className: string,
  schoolId: string = 'THCS_NVC'
): Promise<boolean> {
  try {
    if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      return false;
    }
    const classId = className || '6a3';
    const schoolYearId = (schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${schoolYearId}_${classId}_${student.id}`;
    const docRef = doc(db, 'students', docId);

    await setDoc(docRef, {
      ...student,
      schoolId,
      schoolYearId,
      classId,
      studentId: student.id,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore student save error:', err);
    return false;
  }
}

export async function saveTransactionToCloud(
  log: any,
  schoolYear: string,
  className: string,
  schoolId: string = 'THCS_NVC'
): Promise<boolean> {
  try {
    if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      return false;
    }
    const classId = className || '6a3';
    const schoolYearId = (schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_');
    const txId = log.transactionId || log.id;
    const docId = `${schoolYearId}_${classId}_${txId}`;
    const docRef = doc(db, 'emulationTransactions', docId);

    await setDoc(docRef, {
      ...log,
      transactionId: txId,
      schoolId,
      schoolYearId,
      classId,
      type: log.scoreDiff > 0 ? 'positive' : 'negative',
      points: Math.abs(log.scoreDiff),
      reason: log.reasonCategory || log.reasonDetail,
      note: log.reasonDetail || '',
      date: log.date || (log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]),
      createdAt: log.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore transaction save error:', err);
    return false;
  }
}

export async function saveSchoolRankingsToCloud(
  schoolYear: string,
  periodKey: string,
  rankings: any[],
  schoolId: string = 'THCS_LQD'
): Promise<boolean> {
  try {
    if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      return false;
    }
    const schoolYearId = (schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${schoolYearId}_${periodKey}`;
    const docRef = doc(db, 'schoolRankings', docId);

    await setDoc(docRef, {
      schoolId,
      schoolYearId,
      periodKey,
      rankings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore school rankings save error:', err);
    return false;
  }
}

export async function saveAttendanceRecordToCloud(
  schoolYear: string,
  className: string,
  dateStr: string,
  dayRecords: Record<string, { status: any; note?: string }>,
  schoolId: string = 'THCS_NVC'
): Promise<boolean> {
  try {
    if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      return false;
    }
    const classId = className || '6a3';
    const schoolYearId = (schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${schoolYearId}_${classId}_${dateStr}`;
    const docRef = doc(db, 'attendance', docId);

    await setDoc(docRef, {
      schoolId,
      schoolYearId,
      classId,
      date: dateStr,
      records: dayRecords,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore attendance save error:', err);
    return false;
  }
}


