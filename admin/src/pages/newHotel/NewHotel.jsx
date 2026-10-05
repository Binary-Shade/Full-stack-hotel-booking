import "./newHotel.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import axios from "axios";
import { ImageList, ImageListItem } from "@mui/material";

const NewHotel = ({ inputs, title }) => {
  const [files, setFiles] = useState(null);
  const [info, setInfo] = useState({});
  const [rooms, setRooms] = useState([]);
  const { data, loading } = useFetch("http://localhost:8001/api/rooms");

  const handleInput = (e) => {
    setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        console.log(`Image ${i + 1} uploaded`);
        urls.push(res.data.secure_url);
      } catch (error) {
        console.error(error);
      }
    }

    console.log("All images uploaded:", urls);

    const updatedInfo = {
      ...info,
      photos: urls,
      rooms,
    };

    try {
      const response = await axios.post("http://localhost:8001/api/hotels/", updatedInfo);
      console.log("Hotel data submitted:", updatedInfo);
      console.log("Server response:", response);
    } catch (error) {
      console.error("Error submitting hotel data:", error);
    }
    setFiles(null)
    setInfo({})
    setRooms([])
  };

  const handleSelect = (e) => {
    const value = Array.from(e.target.selectedOptions, (option) => option.value);
    setRooms(value);
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
          <div className="img-container">
            {files ? (
              <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
                {Array.from(files).map((file) => (
                  <ImageListItem key={file.name}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      loading="lazy"
                      style={{ objectFit: "cover" }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <img
                className="no-img"
                src="https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
                alt="preview"
              />
            )}
          </div>
          <div className="right">
            <form>
              <div className="formInput">
                <label htmlFor="file">
                  Image: <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>

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

              <div className="features">
                <label>Featured</label>
                <select id="featured" onChange={handleInput}>
                  <option value={false}>No</option>
                  <option value={true}>Yes</option>
                </select>
              </div>

              <div className="selectRooms">
                <label>Select Rooms</label>
                <select id="selectRooms" multiple onChange={handleSelect}>
                  {loading
                    ? "loading ..."
                    : data &&
                      data.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.title}
                        </option>
                      ))}
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

export default NewHotel;
