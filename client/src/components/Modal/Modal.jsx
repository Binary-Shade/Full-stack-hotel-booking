import { useContext, useEffect, useRef, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import './modal.css';
import { SearchContext } from '../../context/searchContext';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import PropTypes from 'prop-types';

const Modal = ({ setModalOpen, id, onReserved }) => {
  const { data, loading, error, reFetch } = useFetch('/api/hotels/room/' + id);
  const [roomId, setRoomId] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { date, dispatch } = useContext(SearchContext);
  const [stay, setStay] = useState(date);
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useRef(null);
  const rooms = Array.isArray(data) ? data.filter(Boolean) : [];
  const selectedRoom = rooms.find(room => room._id === roomId);
  const nights = differenceInCalendarDays(stay[0].endDate, stay[0].startDate);
  const validDates = stay[0].startDate >= startOfDay(new Date()) && nights > 0 && nights <= 30;
  const stayDates = validDates
    ? Array.from({ length: nights }, (_, index) => startOfDay(addDays(stay[0].startDate, index)).getTime()) : [];
  const available = number => !number.unavailableDates.some(value => stayDates.includes(startOfDay(new Date(value)).getTime()));

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  const changeDate = (key, value) => {
    if (!value) return;
    const nextDate = [{ ...stay[0], [key]: new Date(value + 'T00:00:00') }];
    setStay(nextDate);
    setSelectedRooms([]);
    setMessage('');
    if (nextDate[0].endDate > nextDate[0].startDate) {
      dispatch({ type: 'NEW_SEARCH', payload: { date: nextDate } });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validDates || !selectedRooms.length || submitting) return;
    setSubmitting(true);
    setMessage('');
    let completed = 0;
    try {
      for (const numberId of selectedRooms) {
        await axios.put('/api/rooms/available/' + numberId, { dates: stayDates });
        completed += 1;
        setSelectedRooms(previous => previous.filter(value => value !== numberId));
      }
      onReserved();
      setModalOpen(false);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login', { state: { returnTo: location.pathname } });
      } else {
        setMessage((completed ? completed + ' room(s) reserved. ' : '') +
          (err.response?.data?.message || 'Could not reserve the remaining rooms. Please try again.'));
        await reFetch();
        setSelectedRooms([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return <dialog className="Modal" ref={dialog} aria-labelledby="reservationTitle" onCancel={event => {
    event.preventDefault();
    if (!submitting) setModalOpen(false);
  }}>
    <form className="ModalContainer" onSubmit={submit}>
      <button className="closer" type="button" aria-label="Close reservation" disabled={submitting} onClick={() => setModalOpen(false)}>×</button>
      <h2 id="reservationTitle">Reserve a room</h2>
      <label>Check-in<input type="date" value={format(stay[0].startDate, 'yyyy-MM-dd')} min={format(new Date(), 'yyyy-MM-dd')} disabled={submitting} onChange={event => changeDate('startDate', event.target.value)} /></label>
      <label>Check-out<input type="date" value={format(stay[0].endDate, 'yyyy-MM-dd')} min={format(addDays(stay[0].startDate, 1), 'yyyy-MM-dd')} disabled={submitting} onChange={event => changeDate('endDate', event.target.value)} /></label>
      {!validDates && <div role="alert">Choose a stay of 1 to 30 nights.</div>}
      {loading ? <div>Loading rooms...</div> : error || !Array.isArray(data) ? <div role="alert">Unable to load rooms. <button type="button" onClick={reFetch}>Try again</button></div> : rooms.length === 0 ? <div>No rooms are available at this property.</div> : <>
        <label htmlFor="reservationRoom">Select room</label><select id="reservationRoom" value={roomId} disabled={submitting} onChange={event => { setRoomId(event.target.value); setSelectedRooms([]); }}>
          <option value="">Choose a room</option>
          {rooms.map(room => <option key={room._id} value={room._id}>{room.title}</option>)}
        </select>
        {selectedRoom && <div className="roomContents">
          <div>Price: $ {selectedRoom.price} per night</div>
          <div>Maximum guests: {selectedRoom.maxpeople}</div>
          <div>{selectedRoom.desc}</div>
          <fieldset><legend>Select room numbers</legend>
            {selectedRoom.roomNumbers.map(number => <label key={number._id} className="roomChoice">
              <input type="checkbox" checked={selectedRooms.includes(number._id)} disabled={submitting || !validDates || !available(number)} onChange={event => setSelectedRooms(previous => event.target.checked ? [...previous, number._id] : previous.filter(value => value !== number._id))} />
              Room {number.number}{!available(number) && ' (unavailable)'}
            </label>)}
          </fieldset>
        </div>}
      </>}
      {message && <div role="alert">{message}</div>}
      <button type="submit" className="ModalBtn" disabled={submitting || loading || Boolean(error) || !validDates || !selectedRooms.length}>{submitting ? 'Reserving...' : 'Reserve now'}</button>
    </form>
  </dialog>;
};

Modal.propTypes = { setModalOpen: PropTypes.func.isRequired, id: PropTypes.string.isRequired, onReserved: PropTypes.func.isRequired };
export default Modal;
