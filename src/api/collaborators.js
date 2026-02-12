import supabase from './client';
import { handleApiError } from './utils';

export const collaboratorsApi = {
    /**
     * 協力者一覧を取得
     */
    async getList() {
        try {
            const { data, error, count } = await supabase
                .from('collaborators')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], count: count || 0 };
        } catch (error) {
            handleApiError(error, 'collaboratorsApi.getList');
        }
    },

    /**
     * 協力者を追加
     */
    async add(attributes) {
        try {
            const { error } = await supabase
                .from('collaborators')
                .insert([attributes]);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'collaboratorsApi.add');
        }
    },

    /**
     * 総協力者数を取得
     */
    async getCount() {
        try {
            const { count, error } = await supabase
                .from('collaborators')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count;
        } catch (error) {
            handleApiError(error, 'collaboratorsApi.getCount');
        }
    }
};
