import {
  saveClassDataToCloud,
  subscribeToUserDataInFirestore,
  loadUserDataFromFirestore,
} from './firebase';

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'error';
  lastSyncedAt: string | null;
  message: string;
}

const ADMIN_EMAIL = 'quynhan9942@gmail.com';

let currentStatus: SyncStatus = {
  state: 'synced',
  lastSyncedAt: null,
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

function updateStatus(
  state: 'synced' | 'syncing' | 'error',
  message: string
) {
  currentStatus = {
    state,
    lastSyncedAt:
      state === 'synced'
        ? new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : currentStatus.lastSyncedAt,
    message,
  };

  statusListeners.forEach((listener) => listener(currentStatus));
}

/**
 * Đồng bộ toàn bộ dữ liệu lớp lên Firebase Firestore.
 * Không còn phụ thuộc Express /api/sync hoặc KVDB.
 */
export async function syncToCloud(fullData: any): Promise<boolean> {
  if (!fullData) return false;

  updateStatus('syncing', 'Đang đồng bộ lên đám mây...');

  try {
    await saveClassDataToCloud({
      ...fullData,
      timestamp: Date.now(),
    });

    updateStatus('synced', '🟢 Đã đồng bộ lên đám mây');
    return true;
  } catch (error) {
    console.warn('Firebase sync error:', error);
    updateStatus('error', '🔴 Lỗi kết nối đám mây - Đang thử lại');
    return false;
  }
}

/**
 * Lấy dữ liệu lớp từ Firebase Firestore.
 */
export async function fetchFromCloud(): Promise<any | null> {
  try {
    const data = await loadUserDataFromFirestore(ADMIN_EMAIL);

    if (data && Array.isArray(data.students) && data.students.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn('Fetch from Firestore error:', error);
  }

  return null;
}

/**
 * Theo dõi dữ liệu Firebase theo thời gian thực.
 */
export function subscribeToCloudSync(
  onDataReceived: (data: any) => void
): () => void {
  let isSubscribed = true;

  const handleData = (data: any) => {
    if (!isSubscribed || !data) return;

    onDataReceived(data);
    updateStatus('synced', '🟢 Đã đồng bộ thời gian thực từ đám mây');
  };

  // Tải dữ liệu hiện tại ngay khi khởi tạo.
  fetchFromCloud()
    .then((data) => {
      if (data) handleData(data);
    })
    .catch((error) => {
      console.warn('Initial cloud data error:', error);
    });

  // Lắng nghe thay đổi trực tiếp từ Firestore.
  const unsubscribe = subscribeToUserDataInFirestore(
    ADMIN_EMAIL,
    (liveData) => {
      if (liveData) {
        handleData(liveData);
      }
    }
  );

  return () => {
    isSubscribed = false;
    unsubscribe();
  };
}
