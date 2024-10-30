import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FaLocationDot } from "react-icons/fa6";
import { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/searchContext";
import Modal from "../../components/Modal/Modal";

const Hotel = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/api/hotels/${id}`);
  
  const { date, options } = useContext(SearchContext);

  // Date difference calculation with basic validation
  const calcTotalDate = (startDate, endDate) => {
    if (!startDate || !endDate) return 0; // Avoid calculations if dates are missing
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMilliseconds = end - start;
    return Math.max(1, Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))); // Ensure at least 1 night
  };
  
  const diff = calcTotalDate(date[0]?.startDate, date[0]?.endDate);

  const handleModel = () => {
    setModalOpen(true);
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      {loading ? (
        <p>Loading hotel data...</p>
      ) : error ? (
        <p>Failed to load hotel information. Please try again later.</p>
      ) : (
        <div className="hotelContainer">
          <div className="hotelWrapper">
            <button className="bookNow" onClick={handleModel}>
              Reserve or Book Now!
            </button>
            <h1 className="hotelTitle" style={{textTransform:'capitalize'}}>{data.name}</h1>
            <div className="hotelAddress">
              <FaLocationDot />
              <span>{data.address}</span>
            </div>
            <span className="hotelDistance">{data.distance}</span>
            <span className="hotelPriceHighlight">
              Book a stay over ${data.cheapestPrice} at this property and get a free airport taxi
            </span>
            <div className="hotelImgWrapper">
            {
              data.photos && data.photos.length > 0 ? (
                data.photos.map((photo, index) => (
                  <img key={index} src={photo} width="300px" alt={`Hotel ${index + 1}`} />
                ))
              ) : (
                <p>No images available</p>
              )
            }
            </div>
            <div className="hotelDetails">
              <div className="hotelDetailsTexts">
                <h1 className="hotelTitle">{data.title}</h1>
                <p className="hotelDesc">{data.desc}</p>
              </div>
              <div className="hotelDetailsPrice">
                <h1>Perfect for a {diff}-night stay!</h1>
                <span>
                  Located in the real heart of Krakow, this property has an
                  excellent location score of 9.8!
                </span>
                <h2>
                  <b>${diff * data.cheapestPrice * options.room}</b> ({diff} nights)
                </h2>
                <button onClick={handleModel}>Reserve or Book Now!</button>
              </div>
              {modalOpen && <Modal setModalOpen={setModalOpen} id={id} />}
            </div>
          </div>
        </div>
      )}
      <MailList />
      <Footer />
    </div>
  );
};

export default Hotel;
