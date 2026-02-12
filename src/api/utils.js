/**
 * 共通のエラーハンドリング関数
 * @param {Error} error - 発生したエラーオブジェクト
 * @param {string} context - エラーが発生したコンテキスト（関数名など）
 * @returns {object} - エラー情報を含むオブジェクト
 */
export const handleApiError = (error, context = 'API Error') => {
    console.error(`[${context}]`, error);
    // 必要に応じてエラー通知UIなどを呼び出す処理をここに追加できる
    throw error;
};
