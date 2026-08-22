import { saveClassDataToCloud, subscribeToUserDataInFirestore, loadUserDataFromFirestore } from './firebase';

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'error';
  lastSyncedAt: string | null;
  message: string;
}

const API_ENDPOINT = '/api/sync/6a3_nguyenvancu';
const KV_ENDPOINT = 'https://kvdb.io/6a3_nguyenvancu_sync_2026/class_data';

let currentStatus: SyncStatus = {
  state: 'synced',
  lastSyncedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  message: 'Đã đồng bộ lên đám mây',
};

const statusListeners: Set<(status: SyncStatus) => void> = new Set();

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

function updateStatus(state: 'synced' | 'syncing' | 'error', message: string) {
  currentStatus = {
    state,
    lastSyncedAt: state === 'synced' ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : currentStatus.lastSyncedAt,
    message,
  };
  statusListeners.forEach((listener) => listener(currentStatus));
}

/**
 * Primary function to sync full class data to cloud REST API and Firestore
 */
export async function syncToCloud(fullData: any): Promise<boolean> {
  if (!fullData) return false;
  updateStatus('syncing', 'Đang đồng bộ lên máy chủ đám mây...');

  let apiSuccess = false;

  // 1. Send POST request to primary Express server API
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullData),
    });
    if (res.ok) {
      apiSuccess = true;
    }
  } catch (err) {
    console.warn('API sync endpoint notice:', err);
  }

  // 2. Try external KV endpoint sync if accessible
  try {
    fetch(KV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullData),
    }).catch(() => {});
  } catch (e) {
    // Ignore KV error
  }

  // 3. Save to Firebase Firestore
  try {
    await saveClassDataToCloud(fullData);
    apiSuccess = true;
  } catch (err) {
    console.warn('Firestore sync notice:', err);
  }

  if (apiSuccess) {
    updateStatus('synced', '🟢 Đã đồng bộ lên đám mây');
    return true;
  } else {
    updateStatus('error', '🔴 Lỗi kết nối đám mây - Đang thử lại');
    return false;
  }
}

/**
 * Fetches the latest data from cloud REST API or Firestore
 */
export async function fetchFromCloud(): Promise<any | null> {
  // 1. Try local Express API
  try {
    const res = await fetch(API_ENDPOINT);
    if (res.ok) {
      const data = await res.json();
      if (data && data.students) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Fetch from API error:', err);
  }

  // 2. Try Firestore
  try {
    const firestoreData = await loadUserDataFromFirestore('quynhan9942@gmail.com');
    if (firestoreData && firestoreData.students) {
      return firestoreData;
    }
  } catch (err) {
    console.warn('Fetch from Firestore error:', err);
  }

  return null;
}

/**
 * Subscribes to real-time cloud data changes via polling + window focus + Firestore onSnapshot
 */
export function subscribeToCloudSync(onDataReceived: (data: any) => void): () => void {
  let isSubscribed = true;
  let lastTimestamp = 0;

  const checkCloudData = async () => {
    if (!isSubscribed) return;
    try {
      const data = await fetchFromCloud();
      if (data && data.timestamp && data.timestamp > lastTimestamp) {
        lastTimestamp = data.timestamp;
        onDataReceived(data);
        updateStatus('synced', '🟢 Đã nhận dữ liệu mới từ đám mây');
      } else if (data && !lastTimestamp) {
        lastTimestamp = data.timestamp || Date.now();
        onDataReceived(data);
      }
    } catch (e) {
      console.warn('Check cloud data error:', e);
    }
  };

  // Initial fetch
  checkCloudData();

  // Polling every 2.5 seconds for instant updates on parent screen
  const intervalId = setInterval(checkCloudData, 2500);

  // Re-check on window focus
  const handleFocus = () => {
    checkCloudData();
  };
  window.addEventListener('focus', handleFocus);

  // Also subscribe to Firestore onSnapshot
  const unsubFirestore = subscribeToUserDataInFirestore('quynhan9942@gmail.com', (liveData) => {
    if (liveData && isSubscribed) {
      onDataReceived(liveData);
      updateStatus('synced', '🟢 Đã đồng bộ thời gian thực từ đám mây');
    }
  });

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    window.removeEventListener('focus', handleFocus);
    unsubFirestore();
  };
}
