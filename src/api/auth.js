import supabase from './client';
import { handleApiError } from './utils';

export const authApi = {
    /**
     * 現在のセッションを取得する
     */
    async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            handleApiError(error, 'authApi.getSession');
        }
    },

    /**
     * メールアドレスとパスワードでサインインする
     */
    async signInWithPassword(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'authApi.signInWithPassword');
        }
    },

    /**
     * サインアウトする
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            handleApiError(error, 'authApi.signOut');
        }
    },

    /**
     * ユーザー情報を更新する
     */
    async updateUser(attributes) {
        try {
            const { data, error } = await supabase.auth.updateUser(attributes);
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'authApi.updateUser');
        }
    },

    /**
     * 管理者権限でユーザーを作成する (注: クライアントサイドでの実行は権限が必要)
     */
    async signUp(email, password, data = {}) {
        try {
            // signUp はデフォルトでは自動ログインするため、管理画面からのユーザー登録用途では注意が必要
            const { data: result, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data }
            });
            if (error) throw error;
            return result;
        } catch (error) {
            handleApiError(error, 'authApi.signUp');
        }
    },

    /**
     * Edge Functionを実行する
     */
    async invokeFunction(functionName, options) {
        try {
            const { data, error } = await supabase.functions.invoke(functionName, options);
            if (error) throw error;
            return data;
        } catch (error) {
            // Edge Functionのエラーは構造が異なる場合があるため、ここでキャッチして上位に投げるか、
            // Resultオブジェクトとして返す設計にするか。
            // ここではエラーをthrowして呼び出し元で処理させる。
            throw error;
        }
    }
};
