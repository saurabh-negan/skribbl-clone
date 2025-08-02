import { create } from 'zustand';

const useUserStore = create((set) => ({
  name: '',
  color: '#00bfff',
  roomCode: '',
  isHost: false,
  setName: (name) => set({ name }),
  setColor: (color) => set({ color }),
  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (value) => set({ isHost: value }),
}));

export default useUserStore;
