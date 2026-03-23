import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface ChatStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: (userId: string, apptIds: string[]) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  fetchUnreadCount: async (userId, apptIds) => {
    if (!userId || apptIds.length === 0) {
      set({ unreadCount: 0 });
      return;
    }
    const { count, error } = await supabase
      .from('appointment_messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false)
      .in('appointment_id', apptIds);
      
    if (!error) {
      set({ unreadCount: count || 0 });
    }
  },
}));
