import api from './index'
import { requireCurrentUserId } from '@/auth/session'

export type DashboardRelationship = {
  id: number
  name: string
  type: string
  eventCount: number
  memoryCount: number
}

export type DashboardData = {
  overview: {
    totalRelationships: number
    totalEvents: number
    totalMemories: number
    totalAiRecords: number
    totalReminders: number
    monthPendingReminders: number
  }
  weeklyReminderTrend: Array<{ count: number }>
  byType: Array<{ type: string; count: number }>
  topRelationships: DashboardRelationship[]
}

export const desktopAuthApi = {
  login: (code: string) => api.post<{ accessToken: string; id: number; nickname?: string }>('/user/desktop-login', { code }),
}

// Dashboard
export const analyticsApi = {
  dashboard: () => api.get<DashboardData>('/analytics/dashboard', { params: { userId: requireCurrentUserId() } }),
  activity: () => api.get('/analytics/activity', { params: { userId: requireCurrentUserId() } }),
}

// Relationships
export const relationshipApi = {
  list: () => api.get('/relationship/list', { params: { userId: requireCurrentUserId() } }),
  detail: (id: number) => api.get(`/relationship/${id}`),
  create: (data: any) => api.post('/relationship/create', { ...data, userId: requireCurrentUserId() }),
  update: (id: number, data: any) => api.put(`/relationship/${id}`, data),
  remove: (id: number) => api.delete(`/relationship/${id}`),
}

// Events
export const eventApi = {
  all: () => api.get<any[]>('/event/all'),
  list: (relationshipId: number) => api.get('/event/list', { params: { relationshipId } }),
  detail: (id: number) => api.get(`/event/${id}`),
  create: (data: any) => api.post('/event/create', data),
  update: (id: number, data: any) => api.put(`/event/${id}`, data),
  remove: (id: number) => api.delete(`/event/${id}`),
}

// Memories
export const memoryApi = {
  all: () => api.get<any[]>('/memory/all'),
  list: (relationshipId: number) => api.get('/memory/list', { params: { relationshipId } }),
  detail: (id: number) => api.get(`/memory/${id}`),
  create: (data: any) => api.post('/memory/create', data),
  update: (id: number, data: any) => api.put(`/memory/${id}`, data),
  remove: (id: number) => api.delete(`/memory/${id}`),
}

// Reminders
export const reminderApi = {
  upcoming: (_userId?: number, days = 30) => api.get('/reminder/upcoming', { params: { userId: requireCurrentUserId(), days } }),
  today: () => api.get('/reminder/today', { params: { userId: requireCurrentUserId() } }),
  acknowledge: (id: number) => api.post(`/reminder/${id}/acknowledge`),
}

// Export
export const exportApi = {
  relationship: (id: number) => api.get(`/export/relationship/${id}`),
  all: () => api.get('/export/all'),
}
