export const authHeader = (token: string | null | undefined): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};
