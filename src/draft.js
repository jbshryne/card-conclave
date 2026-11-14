// The search form's unsent state is kept in sessionStorage so Back returns to what you typed.
const KEY = "cardConclaveDraft";

export const loadDraft = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const saveDraft = (params) => {
  try {
    sessionStorage.setItem(KEY, params.toString());
  } catch {}
};
export const clearDraft = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
};
