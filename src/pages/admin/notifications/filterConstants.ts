export const PAGE_SIZE = 20;

/** Select는 빈 값을 가질 수 없어 '전체'를 이 값으로 표현하고 쿼리에 넘길 때 뺀다 */
export const ALL = 'all';
export const orUndefined = (value: string) => (value === ALL || value === '' ? undefined : value);
