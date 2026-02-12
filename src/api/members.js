import supabase from './client';
import { handleApiError } from './utils';

export const membersApi = {
    /**
     * メンバー一覧を取得（関連テーブル結合済み）
     */
    async getList() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select(`
                    *,
                    master_organization (name),
                    master_position (name),
                    master_project_role (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'membersApi.getList');
        }
    },

    /**
     * IDでメンバーを取得
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'membersApi.getById');
        }
    },

    /**
     * メンバー情報の更新
     */
    async update(id, attributes) {
        try {
            const { error } = await supabase
                .from('members')
                .update(attributes)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'membersApi.update');
        }
    },

    /**
     * メンバーを新規作成
     */
    async create(attributes) {
        try {
            const { data, error } = await supabase
                .from('members')
                .insert([attributes])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'membersApi.create');
        }
    },

    /**
     * AuthユーザーIDからメンバーを取得
     */
    async getByAuthId(authId) {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('auth_user_id', authId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'membersApi.getByAuthId');
        }
    },

    /**
     * 分析用に全メンバーデータを取得（組織情報含む）
     */
    async getAllForAnalysis() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*, organization:master_organization(name)');

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'membersApi.getAllForAnalysis');
        }
    },

    /**
     * メンバーをUpsert（主にLINE連携用）
     */
    async upsert(attributes, onConflict = 'auth_user_id') {
        try {
            const { data, error } = await supabase
                .from('members')
                .upsert(attributes, { onConflict })
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'membersApi.upsert');
        }
    }
};
