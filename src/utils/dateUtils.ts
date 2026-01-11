/**
 * 日付ユーティリティ関数
 */

/**
 * 指定された日付が今日かどうかを判定
 */
export const isToday = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

/**
 * 指定された日付が今週かどうかを判定
 */
export const isThisWeek = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return date >= startOfWeek && date < endOfWeek;
};

/**
 * 指定された日付が期限超過かどうかを判定
 */
export const isOverdue = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    return date < now;
};

/**
 * 日付をローカライズされた文字列に変換
 */
export const formatDateLocale = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
};
