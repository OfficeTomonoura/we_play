import supabase from './client';
import { handleApiError } from './utils';
import { masterApi } from './master';

export const analysisApi = {
    /**
     * 過去N日間の日別応募数を取得（累積）
     * @param {number} days 
     */
    async getDailyRegistrationCounts(days = 7) {
        try {
            const labels = [];
            const counts = [];

            // Note: Parallel execution would be faster, but keeping sequential for simplicity as in original code for now.
            // Or better, use Promise.all.
            const promises = [];

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const label = (date.getMonth() + 1) + '/' + date.getDate();

                promises.push(
                    supabase
                        .from('applicants')
                        .select('*', { count: 'exact', head: true })
                        .lte('created_at', dateStr + 'T23:59:59')
                        .then(({ count, error }) => {
                            if (error) throw error;
                            return { label, count: count || 0, dateStr }; // dateStr for sorting if needed
                        })
                );
            }

            const results = await Promise.all(promises);
            // Promise.allの結果は順序が保証されるが、念のため作成順にしておく

            return {
                labels: results.map(r => r.label),
                counts: results.map(r => r.count)
            };
        } catch (error) {
            handleApiError(error, 'analysisApi.getDailyRegistrationCounts');
        }
    },

    /**
     * 認知経路ごとの応募数を取得
     */
    async getReferralDistribution() {
        try {
            const sources = await masterApi.getReferralSources();
            if (!sources) return { labels: [], counts: [] };

            const labels = [];
            const counts = [];
            const promises = [];

            for (const source of sources) {
                promises.push(
                    supabase
                        .from('applicants')
                        .select('*', { count: 'exact', head: true })
                        .eq('referral_source_id', source.id)
                        .then(({ count, error }) => {
                            if (error) throw error;
                            return { name: source.name, count: count || 0 };
                        })
                );
            }

            const results = await Promise.all(promises);

            results.forEach(r => {
                if (r.count > 0) {
                    labels.push(r.name);
                    counts.push(r.count);
                }
            });

            return { labels, counts };
        } catch (error) {
            handleApiError(error, 'analysisApi.getReferralDistribution');
        }
    }
};
