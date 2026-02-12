import supabase from './client';
import { handleApiError } from './utils';

export const lineApi = {
    /**
     * ステータスでメッセージを取得
     */
    async getMessagesByStatus(status) {
        try {
            let query = supabase.from('line_messages').select('*').eq('status', status);

            if (status === 'pending') {
                query = query.order('scheduled_at', { ascending: true });
            } else if (status === 'scheduled') {
                query = query.order('scheduled_at', { ascending: true });
            } else if (status === 'sent') {
                query = query.order('approved_at', { ascending: false }).limit(20);
            } else if (status === 'rejected') {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, `lineApi.getMessagesByStatus(${status})`);
        }
    },

    /**
     * 受信メッセージを取得
     */
    async getReceivedMessages(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('line_received_messages')
                .select('*')
                .order('received_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'lineApi.getReceivedMessages');
        }
    },

    /**
     * IDでメッセージを取得
     */
    async getMessageById(id) {
        try {
            const { data, error } = await supabase
                .from('line_messages')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'lineApi.getMessageById');
        }
    },

    /**
     * メッセージを作成
     */
    async createMessage(attributes) {
        try {
            const { error } = await supabase
                .from('line_messages')
                .insert([attributes]);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'lineApi.createMessage');
        }
    },

    /**
     * メッセージを更新
     */
    async updateMessage(id, attributes) {
        try {
            const { error } = await supabase
                .from('line_messages')
                .update(attributes)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'lineApi.updateMessage');
        }
    },

    /**
     * メッセージを削除
     */
    async deleteMessage(id) {
        try {
            const { error } = await supabase
                .from('line_messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'lineApi.deleteMessage');
        }
    },

    /**
     * ステータスを一括更新（期限切れのpendingをrejectedにする等）
     */
    async batchUpdateStatus(ids, attributes) {
        try {
            const { error } = await supabase
                .from('line_messages')
                .update(attributes)
                .in('id', ids);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'lineApi.batchUpdateStatus');
        }
    },

    /**
     * メッセージ配信（Edge Function実行）
     */
    async broadcastMessage(id) {
        try {
            const { data, error } = await supabase.functions.invoke('broadcast-line', {
                body: { messageId: id }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'lineApi.broadcastMessage');
        }
    }
};
