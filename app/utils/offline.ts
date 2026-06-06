import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from './api';

const OFFLINE_STORAGE_KEY = 'offline_submissions';
const ONLINE_CHECK_INTERVAL = 5000;

interface OfflineSubmission {
  id: string;
  type: 'issue';
  data: any;
  created_at: number;
  status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
  error?: string;
}

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let syncInProgress = false;

export function initOfflineSupport() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', () => {
    isOnline = true;
    syncPendingSubmissions();
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
  
  setInterval(() => {
    if (isOnline) {
      syncPendingSubmissions();
    }
  }, ONLINE_CHECK_INTERVAL);
}

export function isOnlineStatus(): boolean {
  return isOnline;
}

export function getOfflineSubmissions(): OfflineSubmission[] {
  if (typeof localStorage === 'undefined') return [];
  const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveOfflineSubmissions(submissions: OfflineSubmission[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(submissions));
}

export async function saveOfflineIssue(issueData: any): Promise<string> {
  const submission: OfflineSubmission = {
    id: uuidv4(),
    type: 'issue',
    data: issueData,
    created_at: Date.now(),
    status: 'pending',
    retry_count: 0
  };
  
  const submissions = getOfflineSubmissions();
  submissions.push(submission);
  saveOfflineSubmissions(submissions);
  
  if (isOnline) {
    syncPendingSubmissions();
  }
  
  return submission.id;
}

export async function syncPendingSubmissions(): Promise<number> {
  if (syncInProgress || !isOnline) return 0;
  
  syncInProgress = true;
  let syncedCount = 0;
  
  try {
    const submissions = getOfflineSubmissions();
    const pending = submissions.filter(s => s.status === 'pending' || s.status === 'failed');
    
    for (const submission of pending) {
      try {
        updateSubmissionStatus(submission.id, 'syncing');
        
        if (submission.type === 'issue') {
          await apiFetch('/api/issues', {
            method: 'POST',
            body: JSON.stringify(submission.data)
          });
        }
        
        removeSubmission(submission.id);
        syncedCount++;
      } catch (error) {
        updateSubmissionStatus(submission.id, 'failed', (error as Error).message);
      }
    }
  } finally {
    syncInProgress = false;
  }
  
  return syncedCount;
}

function updateSubmissionStatus(id: string, status: OfflineSubmission['status'], error?: string) {
  const submissions = getOfflineSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].status = status;
    submissions[index].retry_count++;
    if (error) {
      submissions[index].error = error;
    }
    saveOfflineSubmissions(submissions);
  }
}

function removeSubmission(id: string) {
  const submissions = getOfflineSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  saveOfflineSubmissions(filtered);
}

export function deleteOfflineSubmission(id: string) {
  removeSubmission(id);
}
