import api from './index'

export interface Team {
  _id: string
  name: string
  members: string[]
  isSandbox: boolean
  createdAt: string
  updatedAt: string
}

export const fetchTeams = () => api.get('/teams')
export const fetchTeam = (id: string) => api.get(`/teams/${id}`)
export const createTeam = (data: Partial<Team>) => api.post('/teams', data)
export const updateTeam = (id: string, data: Partial<Team>) => api.put(`/teams/${id}`, data)
export const deleteTeam = (id: string) => api.delete(`/teams/${id}`)
