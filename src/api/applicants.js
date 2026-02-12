import supabase from './client';
import { handleApiError } from './utils';

export const applicantsApi = {
    /**
     * 応募者リストを取得
     */
    async getList({ page = 1, limit = 20, roleId, status }) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            let query = supabase
                .from('applicants')
                .select('*, r1:master_role!desired_role_1_id(name), r2:master_role!desired_role_2_id(name), r3:master_role!desired_role_3_id(name), ref:master_referral_source!referral_source_id(name), school:master_school(name)', { count: 'exact' });

            if (roleId) {
                query = query.or(`desired_role_1_id.eq.${roleId},desired_role_2_id.eq.${roleId},desired_role_3_id.eq.${roleId}`);
            }
            if (status) {
                query = query.eq('status', status);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { data, count: count || 0 };
        } catch (error) {
            handleApiError(error, 'applicantsApi.getList');
        }
    },

    /**
     * 応募者ステータスを更新
     */
    async updateStatus(id, { status, assignedRoleId }) {
        try {
            const { error } = await supabase
                .from('applicants')
                .update({
                    status,
                    assigned_role_id: assignedRoleId,
                    updated_at: new Date()
                })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.updateStatus');
        }
    },

    /**
     * 総応募者数を取得
     */
    async getTotalCount() {
        try {
            const { count, error } = await supabase
                .from('applicants')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getTotalCount');
        }
    },

    /**
     * 特定の役割（第一希望）を希望している人数を取得
     */
    async getCountByRole(roleId) {
        try {
            const { count, error } = await supabase
                .from('applicants')
                .select('*', { count: 'exact', head: true })
                .eq('desired_role_1_id', roleId);

            if (error) throw error;
            return count;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getCountByRole');
        }
    },

    /**
     * 選抜者リストを取得（サポーター情報含む）
     */
    async getSelectedList(status = '採用') {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .select('*, arm:master_role!assigned_role_id(name), supporter_schedules(*)')
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'applicantsApi.getSelectedList');
        }
    },

    /**
     * IDで応募者情報を取得（詳細用）
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .select('*, r1:master_role!desired_role_1_id(name), r2:master_role!desired_role_2_id(name), r3:master_role!desired_role_3_id(name), ref:master_referral_source!referral_source_id(name), school:master_school(name), arm:master_role!assigned_role_id(name), supporter_schedules(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getById');
        }
    },

    /**
     * ダッシュボード用：新規または直近更新の応募者を取得
     */
    async getRecentOrNew() {
        try {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoISO = twoDaysAgo.toISOString();

            const { data, error } = await supabase
                .from('applicants')
                .select('*, r1:master_role!desired_role_1_id(name), school:master_school(name)')
                .or(`status.eq.新規,created_at.gte.${twoDaysAgoISO}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getRecentOrNew');
        }
    },

    /**
     * 分析用に全データを取得（関連データ含む）
     */
    async getAllForAnalysis() {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .select('*, r1:master_role!desired_role_1_id(name), rs:master_referral_source(name), school:master_school(name)');

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'applicantsApi.getAllForAnalysis');
        }
    },

    // --- Comments ---

    async getComments(applicantId) {
        try {
            const { data, error } = await supabase
                .from('applicant_comments')
                .select('*, members(full_name)')
                .eq('applicant_id', applicantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'applicantsApi.getComments');
        }
    },

    async getCommentById(id) {
        try {
            const { data, error } = await supabase
                .from('applicant_comments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getCommentById');
        }
    },

    async addComment(payload) {
        try {
            const { error } = await supabase
                .from('applicant_comments')
                .insert([payload]);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.addComment');
        }
    },

    async updateComment(id, content) {
        try {
            const { error } = await supabase
                .from('applicant_comments')
                .update({ content })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.updateComment');
        }
    },

    async deleteComment(id) {
        try {
            const { error } = await supabase
                .from('applicant_comments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.deleteComment');
        }
    },

    // --- Supporter Schedules ---

    async getSupporterSchedules(applicantId) {
        try {
            const { data, error } = await supabase
                .from('supporter_schedules')
                .select('*')
                .eq('applicant_id', applicantId)
                .order('start_date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'applicantsApi.getSupporterSchedules');
        }
    },

    async addSupporterSchedule(payload) {
        try {
            const { error } = await supabase
                .from('supporter_schedules')
                .insert([payload]);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.addSupporterSchedule');
        }
    },

    async deleteSupporterSchedule(id) {
        try {
            const { error } = await supabase
                .from('supporter_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'applicantsApi.deleteSupporterSchedule');
        }
    },

    /**
     * LINEユーザーIDで応募者情報を取得
     */
    async getByLineUserId(lineUserId) {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .select('*')
                .eq('line_user_id', lineUserId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'applicantsApi.getByLineUserId');
        }
    },

    /**
     * 応募者情報を新規作成
     */
    async create(attributes) {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .insert([attributes])
                .select('*, r1:master_role!desired_role_1_id(name), r2:master_role!desired_role_2_id(name), r3:master_role!desired_role_3_id(name), ref:master_referral_source!referral_source_id(name)')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'applicantsApi.create');
        }
    }
};
