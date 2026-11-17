import { MunicipalityData, UserSession } from '../types/finance';
import {
  fetchMunicipalityDataFromFirestore,
  saveMunicipalityDataToFirestore,
  subscribeToMunicipalityData,
  testConnection
} from './firebase';

const LOCAL_STORAGE_DATA_KEY = 'mahasarakham_municipality_finance_2570';
const LOCAL_STORAGE_USER_KEY = 'mahasarakham_finance_user_session';

export { subscribeToMunicipalityData, testConnection };

export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    if (result.success && result.user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(result.user));
      return { success: true, user: result.user };
    }
    return { success: false, message: result.message || 'เข้าสู่ระบบไม่สำเร็จ' };
  } catch (err: any) {
    // Client fallback if offline
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    if (cleanUser === 'User' && cleanPass === '1234') {
      const u: UserSession = {
        username: 'User',
        role: 'staff',
        roleTitle: 'เจ้าหน้าที่ฝ่ายการเงินและบัญชี',
        name: 'เจ้าหน้าที่การเงินและบัญชี (User)',
        permissions: { canEditDaily: true, canImportExport: true, canVerify: false, canExecutiveOverview: true }
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      return { success: true, user: u };
    } else if (cleanUser === 'Director' && cleanPass === '1234') {
      const u: UserSession = {
        username: 'Director',
        role: 'director',
        roleTitle: 'ผู้อำนวยการกองคลัง',
        name: 'ผู้อำนวยการกองคลัง (Director)',
        permissions: { canEditDaily: true, canImportExport: true, canVerify: true, canExecutiveOverview: true }
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      return { success: true, user: u };
    } else if (cleanUser === 'Executive' && cleanPass === '1234') {
      const u: UserSession = {
        username: 'Executive',
        role: 'executive',
        roleTitle: 'ผู้บริหารเทศบาลเมืองมหาสารคาม',
        name: 'นายกเทศมนตรี / ผู้บริหาร (Executive)',
        permissions: { canEditDaily: false, canImportExport: true, canVerify: true, canExecutiveOverview: true }
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      return { success: true, user: u };
    }
    return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
  }
}

export function getStoredUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}

// Ensure หมวดรายได้จากทรัพย์สิน is present in revenueCategories and synced to Firebase Firestore
export function ensureRevenuePropertyCategory(data: MunicipalityData): MunicipalityData {
  if (!data || !data.revenueCategories) return data;
  const hasProperty = data.revenueCategories.some(
    (c) => c.id === 'rev_property' || c.name.includes('ทรัพย์สิน')
  );
  if (!hasProperty) {
    const feeIndex = data.revenueCategories.findIndex(
      (c) => c.id === 'rev_fee' || c.name.includes('ค่าธรรมเนียม')
    );
    const propertyCat = {
      id: 'rev_property',
      name: 'หมวดรายได้จากทรัพย์สิน',
      estimate: 16500000,
      actual: 10250000,
      notes: '',
      subItems: []
    };
    const updatedCategories = [...data.revenueCategories];
    if (feeIndex !== -1) {
      updatedCategories.splice(feeIndex + 1, 0, propertyCat);
    } else {
      updatedCategories.unshift(propertyCat);
    }
    const updatedData: MunicipalityData = {
      ...data,
      revenueCategories: updatedCategories,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: 'ระบบเพิ่มหมวดรายได้จากทรัพย์สิน'
    };
    // Save to Firebase Firestore and local storage immediately
    saveMunicipalityDataToFirestore(updatedData).catch((err) =>
      console.warn('Auto-sync rev_property to Firestore error:', err)
    );
    try {
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(updatedData));
    } catch {
      // Ignore
    }
    return updatedData;
  }
  return data;
}

// Fetch municipality data: Priority 1 = Firebase Firestore, Priority 2 = Local Backend, Priority 3 = LocalStorage Cache
export async function fetchMunicipalityData(): Promise<MunicipalityData | null> {
  // 1. Try Firebase Firestore
  try {
    const firestoreData = await fetchMunicipalityDataFromFirestore();
    if (firestoreData && firestoreData.fiscalYear) {
      const ensuredData = ensureRevenuePropertyCategory(firestoreData);
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(ensuredData));
      return ensuredData;
    }
  } catch (err) {
    console.warn('Firebase Firestore fetch error:', err);
  }

  // 2. Try server backend API (and seed to Firestore if found)
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.data) {
        const ensuredData = ensureRevenuePropertyCategory(body.data);
        localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(ensuredData));
        // Seed to Firebase Firestore so it's populated for all users
        saveMunicipalityDataToFirestore(ensuredData).catch((e) =>
          console.warn('Error seeding to Firestore:', e)
        );
        return ensuredData;
      }
    }
  } catch (err) {
    console.warn('Server fetch error, fallback to local cache:', err);
  }

  // 3. Fallback to local storage
  const cached = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      const ensuredData = ensureRevenuePropertyCategory(data);
      // Attempt background seed to Firestore
      saveMunicipalityDataToFirestore(ensuredData).catch(() => {});
      return ensuredData;
    } catch {
      return null;
    }
  }
  return null;
}

// Save municipality data to Firebase Firestore (and sync to server backend + local storage)
export async function saveMunicipalityData(data: MunicipalityData): Promise<boolean> {
  // 1. Immediate optimistic local update
  try {
    localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. Primary persistence: Firebase Firestore in project financeandtreasurymanagement01
  let firestoreSuccess = false;
  try {
    firestoreSuccess = await saveMunicipalityDataToFirestore(data);
  } catch (err) {
    console.warn('Firebase Firestore save error:', err);
  }

  // 3. Asynchronously sync with Express backend as backup
  try {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch((err) => console.warn('Server sync error:', err));
  } catch (err) {
    // Ignore
  }

  return firestoreSuccess;
}

export async function resetMunicipalityData(): Promise<MunicipalityData | null> {
  try {
    const res = await fetch('/api/data/reset', { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.data) {
        localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(body.data));
        await saveMunicipalityDataToFirestore(body.data);
        return body.data;
      }
    }
  } catch (err) {
    console.warn('Reset error on server:', err);
  }
  return null;
}
