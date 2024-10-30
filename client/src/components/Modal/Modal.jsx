import { useContext, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import './modal.css'
import { IoClose } from "react-icons/io5";
import { SearchContext } from '../../context/searchContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Toaster, { toast } from 'react-hot-toast'

const Modal = ({setModalOpen, id}) => {
  const {data, loading, error} = useFetch(`/api/hotels/room/${id}`)
  const [selectRoom, setSelectRoom] = useState('')
  const [selectedRooms, setSelectedRooms] = useState([])
  const {date} = useContext(SearchContext)
  const navigate = useNavigate()
  // console.log(data);
  const selectedRoom = data.find(room => room.title == selectRoom)
  console.log(selectedRoom);
  const handleChange = (e) =>{
    setSelectRoom(e.target.value)
  }

  const handleCheck = (e) =>{
    const checked = e.target.checked
    const value = e.target.value
    setSelectedRooms(
      checked ? [...selectedRooms, value] : selectedRooms.filter(item => item !== value)
    )
  }

  const dateInRange = (startDate, endDate) => {
    const start = new Date(startDate);  // Starting date
    const end = new Date(endDate);      // Ending date
  
    let dateNow = new Date(start);  // Initialize dateNow as a Date object
    const datesList = [];
  
    // While dateNow is before the end date
    while (dateNow <= end) {
      datesList.push(new Date(dateNow).getTime());  // Add current date to list
      dateNow.setDate(dateNow.getDate() + 1);  // Increment by one day
    }
  
    return datesList;  // Return the list of dates
  }
  
  const allDatesRange = (dateInRange(date[0].startDate, date[0].endDate))

  const isAvailable = (roomNumber) => {
    const isFound = roomNumber.unavailableDates.some(date => allDatesRange.includes(new Date(date).getTime()))
    return !isFound;
  }

  const handleSubmit =async (e) =>{
    try {
      await Promise.all(selectedRooms.map(roomId => {
        const response = axios.put(`/api/rooms/available/${roomId}`, {dates: allDatesRange})
        console.log(response.data);
      }))
      setModalOpen(false)
      navigate('/')
    } catch (err) {
      console.log(err);
    }

  }

  return (
    <>
      {loading ? "loading" : 
        <div className='Modal'>
        <div className="ModalContainer">
        <div className="closer">
        <IoClose 
            onClick={()=>setModalOpen(false)}
        />
        </div>
            <p className='Rtext'>Reserve Hotel !</p>
          <div className="roomSelect">
          <span>select room :</span>
        <select name="select" id="selecter"  onChange={handleChange}  className='select'>
          <option value="">--select room--</option>
          {
            data.map(room=>(
              <option key={room._id} value={room.title}>{room.title}</option>
            ))
          }
        </select>
          </div>
        {
          selectRoom && 
          <>
            <div className="roomContents">
              <div className="roomTitle">room name: {selectedRoom.title}</div>
              <div className="roomPrice">Price:$ {selectedRoom.price}</div>
              <div className="maxPeople">Max-People : {selectedRoom.maxpeople}</div>
              <div className="description">Description : {selectedRoom.desc}</div>
              <div className="roomNumber">
                <span>select room number :</span>
                {
                  selectedRoom.roomNumbers.map(number =>(
                    <div 
                    className="roomSelectorContainer">
                      <div className='roomSelector'>
                      <span>{number.number}</span>
                      <input type="checkbox" disabled={!isAvailable(number)} key={number._id} value={number._id} onChange={handleCheck}/>
                    </div>
                    </div>
                  ))
                }
              </div>
            </div>   
          </>
        }
        <div className="btnDiv">
        <button className='ModalBtn' onClick={handleSubmit}>Reserve Now !</button>
        </div>
        </div>
    </div>
      }
    </>
  )
}

export default Modal