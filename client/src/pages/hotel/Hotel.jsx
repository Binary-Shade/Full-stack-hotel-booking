import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FaLocationDot } from "react-icons/fa6";
import { useContext, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/searchContext";
import Modal from "../../components/Modal/Modal";
import { AuthContext } from "../../context/AuthContext";
import { differenceInCalendarDays, format } from "date-fns";

const Hotel = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [reserved, setReserved] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/api/hotels/${id}`);
  
  const { date, options } = useContext(SearchContext);

  const diff = differenceInCalendarDays(date[0].endDate, date[0].startDate);

  const handleModel = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }
    setReserved(false);
    setModalOpen(true);
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      {loading ? (
        <p>Loading hotel data...</p>
      ) : error || !data?._id ? (
        <p>Failed to load hotel information. Please try again later.</p>
      ) : (
        <div className="hotelContainer">
          <div className="hotelWrapper">
            {reserved && <div role="status">Your selected rooms have been reserved.</div>}
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
                <span>{format(date[0].startDate, 'MMM d, yyyy')} to {format(date[0].endDate, 'MMM d, yyyy')} · {options.adult} adults · {options.children} children · {options.room} rooms</span>
                <Link to={`/hotels?${new URLSearchParams({ city: data.city })}`}>Change dates and guests</Link>
                <span>
                  Located in the real heart of Krakow, this property has an
                  excellent location score of 9.8!
                </span>
                <h2>
                  <b>${diff * data.cheapestPrice * options.room}</b> ({diff} nights)
                </h2>
                <button onClick={handleModel}>Reserve or Book Now!</button>
              </div>
              {modalOpen && <Modal setModalOpen={setModalOpen} id={id} onReserved={() => setReserved(true)} />}
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
