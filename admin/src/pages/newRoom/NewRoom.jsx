import "./newRoom.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useState } from "react";
import axios from "axios";
import useFetch from "../../hooks/useFetch";

const NewRoom = ({ inputs, title }) => {
  const [info, setInfo] = useState({});
  const [hotelId, setHotelId] = useState(undefined)
  const [rooms, setRooms] = useState([])
  const { data, loading, error } = useFetch("http://localhost:8001/api/rooms");
  const handleInput = (e) => {
    setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const roomNumbers = rooms.split(',').map(room => (
      {
        roomNumbers : room
      }
    ))
    try {
      const response = axios.post(`http://localhost:8001/api/rooms/${hotelId}`, {...info,roomNumbers})
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />
        <div className="top">
          <h1>{title}</h1>
        </div>
        <div className="bottom">
          <div className="right">
            <form>
              {inputs.map((input) => (
                <div className="formInput" key={input.id}>
                  <label>{input.label}</label>
                  <input
                    id={input.id}
                    onChange={handleInput}
                    type={input.type}
                    placeholder={input.placeholder}
                    value={info[input.id] || ""}
                  />
                </div>
              ))}
              <div className="formInput">
                  <label>enter room numbers</label>
                  <textarea id="textarea"
                    onChange={e=>setRooms(e.target.value)}
                    placeholder="enter room numbers separated by comma"
                  ></textarea>
                </div>
              <div className="formInput">
                <label htmlFor="hotelSelect">choose a hotel</label>
                <select id="hotelId" onChange={e=>setHotelId(e.target.value)}>
                  {
                    loading ? "loading ..." : data && data.map(item => (
                      <option key={item._id} value={item._id}>{item.title}</option>
                    ))
                  }
                </select>
              </div>
              <button onClick={handleClick}>Save</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRoom;
