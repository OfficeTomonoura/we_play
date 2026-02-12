import supabase from './client';
import { handleApiError } from './utils';

export const masterApi = {
    /**
     * 指定したマスタテーブルの全データを取得
     * @param {string} tableName 
     * @param {string} orderBy 
     * @returns 
     */
    async getTable(tableName, orderBy = 'sort_order') {
        try {
            const { data, error } = await supabase.from(tableName).select('*').order(orderBy);
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, `masterApi.getTable(${tableName})`);
        }
    },

    async getRoles() {
        return this.getTable('master_role');
    },

    async getSchools() {
        return this.getTable('master_school');
    },

    async getReferralSources() {
        return this.getTable('master_referral_source');
    },

    async getOrganizations() {
        return this.getTable('master_organization');
    },

    async getPositions() {
        return this.getTable('master_position');
    },

    async getProjectRoles() {
        return this.getTable('master_project_role');
    },

    async createItem(tableName, item) {
        try {
            const { data, error } = await supabase.from(tableName).insert([item]).select();
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, `masterApi.createItem(${tableName})`);
        }
    },

    async updateItem(tableName, id, item) {
        try {
            const { data, error } = await supabase.from(tableName).update(item).eq('id', id).select();
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, `masterApi.updateItem(${tableName})`);
        }
    },

    async deleteItem(tableName, id) {
        try {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            handleApiError(error, `masterApi.deleteItem(${tableName})`);
        }
    }
};

