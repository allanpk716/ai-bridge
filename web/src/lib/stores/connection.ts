import { create } from 'zustand'

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting' | 'error'

interface ConnectionStore {
  status: ConnectionStatus
  setStatus: (status: ConnectionStatus) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: 'offline',
  setStatus: (status) => set({ status }),
  reset: () => set({ status: 'offline' }),
}))
