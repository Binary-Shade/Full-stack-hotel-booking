import { createContext, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';

const defaults = () => ({
  city: '', destination: '',
  date: [{ startDate: new Date(), endDate: new Date(new Date().setDate(new Date().getDate() + 1)), key: 'selection' }],
  options: { adult: 1, children: 0, room: 1 },
});

const normalize = (saved) => {
  const fallback = defaults();
  const range = saved?.date?.[0];
  const startDate = new Date(range?.startDate);
  const endDate = new Date(range?.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const options = Object.fromEntries(Object.entries(fallback.options).map(([key, minimum]) => {
    const value = Number(saved?.options?.[key]);
    return [key, Number.isInteger(value) && value >= minimum ? value : minimum];
  }));
  const city = saved?.destination ?? saved?.city ?? '';
  return {
    city, destination: city, options,
    date: startDate >= today && endDate > startDate
      ? [{ startDate, endDate, key: 'selection' }] : fallback.date,
  };
};

const loadSearch = () => {
  try { return normalize(JSON.parse(localStorage.getItem('searchState'))); }
  catch { return defaults(); }
};

export const SearchContext = createContext(defaults());

const searchReducer = (state, action) => {
  switch (action.type) {
    case 'NEW_SEARCH': return normalize({ ...state, ...action.payload });
    case 'RESET_SEARCH': return defaults();
    default: return state;
  }
};

export const SearchContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, undefined, loadSearch);
  useEffect(() => {
    try { localStorage.setItem('searchState', JSON.stringify(state)); }
    catch { /* Search continues when browser storage is unavailable. */ }
  }, [state]);
  return <SearchContext.Provider value={{ ...state, dispatch }}>{children}</SearchContext.Provider>;
};

export const useSearchContext = () => useContext(SearchContext);
SearchContextProvider.propTypes = { children: PropTypes.node.isRequired };
