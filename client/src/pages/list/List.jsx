import './list.css';
import Navbar from '../../components/navbar/Navbar';
import Header from '../../components/header/Header';
import { useSearchParams } from 'react-router-dom';
import { useContext, useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-date-range';
import SearchItem from '../../components/searchItem/SearchItem';
import useFetch from '../../hooks/useFetch';
import { SearchContext } from '../../context/searchContext';

const HotelResults = () => {
  const [params, setParams] = useSearchParams();
  const search = useContext(SearchContext);
  const [destination, setDestination] = useState(params.get('city') || '');
  const [type, setType] = useState(params.get('type') || '');
  const [date, setDate] = useState(search.date);
  const [options, setOptions] = useState(search.options);
  const [openDate, setOpenDate] = useState(false);
  const [min, setMin] = useState(params.get('min') || '');
  const [max, setMax] = useState(params.get('max') || '');
  const [validation, setValidation] = useState('');
  const { data, loading, error, reFetch } = useFetch('/api/hotels?' + params);

  const submit = (event) => {
    event.preventDefault();
    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      setValidation('Maximum price must be at least the minimum price.');
      return;
    }
    if (date[0].endDate <= date[0].startDate) {
      setValidation('Choose a check-out date after check-in.');
      return;
    }
    setValidation('');
    search.dispatch({ type: 'NEW_SEARCH', payload: { destination: destination.trim(), date, options } });
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ city: destination.trim(), type, min, max })) {
      if (value !== '') next.set(key, value);
    }
    if (next.toString() === params.toString()) reFetch();
    else setParams(next);
    setOpenDate(false);
  };

  return <>
    <Navbar /><Header type="list" />
    <div className="listContainer"><div className="listWrapper">
      <form className="listSearch" onSubmit={submit}>
        <h1 className="lsTitle">Search</h1>
        <label className="lsItem">Destination<input value={destination} onChange={e => setDestination(e.target.value)} /></label>
        <label className="lsItem">Property type<select value={type} onChange={e => setType(e.target.value)}>
          <option value="">All properties</option>
          {['hotel', 'apartment', 'resort', 'villa', 'cabin', 'hostel', 'guest house'].map(value => <option key={value} value={value}>{value}</option>)}
        </select></label>
        <div className="lsItem"><label>Check-in / check-out</label>
          <button type="button" className="lsDate" aria-expanded={openDate} onClick={() => setOpenDate(!openDate)}>{format(date[0].startDate, 'MM/dd/yyyy')} to {format(date[0].endDate, 'MM/dd/yyyy')}</button>
          {openDate && <DateRange onChange={item => setDate([item.selection])} minDate={new Date()} ranges={date} />}
        </div>
        <div className="lsOptions">
          <label className="lsOptionItem">Min price per night<input aria-label="Minimum price" type="number" min="0" step="any" value={min} onChange={e => setMin(e.target.value)} className="lsOptionInput" /></label>
          <label className="lsOptionItem">Max price per night<input aria-label="Maximum price" type="number" min="0" step="any" value={max} onChange={e => setMax(e.target.value)} className="lsOptionInput" /></label>
          {Object.entries({ adult: 'Adults', children: 'Children', room: 'Rooms' }).map(([key, label]) => <label key={key} className="lsOptionItem">{label}<input type="number" min={key === 'children' ? 0 : 1} required value={options[key]} onChange={e => setOptions(prev => ({ ...prev, [key]: e.target.value === '' ? '' : Number(e.target.value) }))} className="lsOptionInput" /></label>)}
        </div>
        {validation && <div role="alert">{validation}</div>}
        <button type="submit">Search</button>
      </form>
      <div className="listResult" aria-live="polite">
        {loading ? 'Loading hotels...' : error || !Array.isArray(data) ? <div role="alert">Unable to load hotels. <button type="button" onClick={reFetch}>Try again</button></div>
          : data.length === 0 ? <p>No properties match your search.</p> : data.map(item => <SearchItem key={item._id} item={item} />)}
      </div>
    </div></div>
  </>;
};

export default function List() {
  const [params] = useSearchParams();
  return <HotelResults key={params.toString()} />;
}
