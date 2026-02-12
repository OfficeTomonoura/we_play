import supabase from './client';
import { handleApiError } from './utils';

export const meetingsApi = {
    /**
     * 会議一覧を取得
     */
    async getList() {
        try {
            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .order('meeting_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'meetingsApi.getList');
        }
    },

    /**
     * 会議詳細を取得（議案含む）
     */
    async getDetails(id) {
        try {
            const { data, error } = await supabase
                .from('meetings')
                .select('*, agendas(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            // 議案を順序順にソートするなどの処理が必要ならここで行う
            if (data && data.agendas) {
                data.agendas.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            }
            return data;
        } catch (error) {
            handleApiError(error, 'meetingsApi.getDetails');
        }
    },

    /**
     * 会議を作成
     */
    async create(attributes) {
        try {
            const { data, error } = await supabase
                .from('meetings')
                .insert([attributes])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'meetingsApi.create');
        }
    },

    /**
     * 会議情報を更新
     */
    async update(id, attributes) {
        try {
            const { error } = await supabase
                .from('meetings')
                .update(attributes)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'meetingsApi.update');
        }
    },

    /**
     * 議案を追加
     */
    async addAgenda(attributes) {
        try {
            const { error } = await supabase
                .from('agendas')
                .insert([attributes]);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'meetingsApi.addAgenda');
        }
    },

    /**
     * 議案を更新
     */
    async updateAgenda(id, attributes) {
        try {
            const { error } = await supabase
                .from('agendas')
                .update(attributes)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'meetingsApi.updateAgenda');
        }
    },

    /**
     * 議案を削除
     */
    async deleteAgenda(id) {
        try {
            const { error } = await supabase
                .from('agendas')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'meetingsApi.deleteAgenda');
        }
    }
};
