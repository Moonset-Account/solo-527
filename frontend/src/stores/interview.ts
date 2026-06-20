import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as interviewsApi from '../api/interviews';
import { InterviewStatus } from '../types';
import type { Interview, SearchParams, PaginatedResult } from '../types';

export const useInterviewStore = defineStore('interview', () => {
  const interviews = ref<Interview[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const currentInterview = ref<Interview | null>(null);

  async function fetchInterviews(params: SearchParams = {}) {
    loading.value = true;
    try {
      const result = (await interviewsApi.getInterviews(params)) as PaginatedResult<Interview>;
      interviews.value = result.data;
      total.value = result.total;
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function fetchInterview(id: string) {
    loading.value = true;
    try {
      const interview = await interviewsApi.getInterview(id);
      currentInterview.value = interview;
      return interview;
    } finally {
      loading.value = false;
    }
  }

  async function quickCreate(data: any) {
    loading.value = true;
    try {
      return await interviewsApi.quickCreate(data);
    } finally {
      loading.value = false;
    }
  }

  async function checkIn(id: string) {
    loading.value = true;
    try {
      const result = await interviewsApi.checkIn(id);
      const interview = interviews.value.find((i) => i._id === id);
      if (interview) {
        interview.status = result.status;
        interview.checkInTime = result.checkInTime;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function updateStatus(id: string, status: InterviewStatus) {
    loading.value = true;
    try {
      const result = await interviewsApi.updateStatus(id, { status });
      const interview = interviews.value.find((i) => i._id === id);
      if (interview) {
        interview.status = result.status;
        if (status === InterviewStatus.IN_PROGRESS) interview.startInterviewTime = result.startInterviewTime;
        if (status === InterviewStatus.COMPLETED) interview.endInterviewTime = result.endInterviewTime;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function cancelInterview(id: string, reason?: string) {
    loading.value = true;
    try {
      const result = await interviewsApi.cancel(id, reason);
      const interview = interviews.value.find((i) => i._id === id);
      if (interview) interview.status = InterviewStatus.CANCELLED;
      return result;
    } finally {
      loading.value = false;
    }
  }

  return {
    interviews,
    total,
    loading,
    currentInterview,
    fetchInterviews,
    fetchInterview,
    quickCreate,
    checkIn,
    updateStatus,
    cancelInterview,
  };
});
