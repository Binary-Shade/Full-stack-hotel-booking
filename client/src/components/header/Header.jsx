  import { FaBed, FaCalendarDay, FaCar, FaPlane, FaTaxi } from "react-icons/fa";
  import { FaPerson } from "react-icons/fa6";
  import "./header.css";
  import { DateRange } from "react-date-range";
  import { useContext, useEffect, useRef, useState } from "react";
  import "react-date-range/dist/styles.css"; // main css file
  import "react-date-range/dist/theme/default.css"; // theme css file
  import { format } from "date-fns";
  import { Link, useNavigate } from "react-router-dom";
  import { FaLongArrowAltRight } from "react-icons/fa";
import { SearchContext } from "../../context/searchContext";
import { AuthContext } from "../../context/AuthContext";
import PropTypes from 'prop-types';

  const Header = ({ type }) => {
    const [destination, setDestination] = useState("");
    const [service, setService] = useState('');
    const [searchError, setSearchError] = useState('');
    const searchRef = useRef(null);
    const [openDate, setOpenDate] = useState(false);
    const [date, setDate] = useState([
      {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        key: "selection",
      },
    ]);
    const [openOptions, setOpenOptions] = useState(false);
    const [options, setOptions] = useState({
      adult: 1,
      children: 0,
      room: 1,
    });

    const navigate = useNavigate();

    const {dispatch} = useContext(SearchContext)

    useEffect(() => {
      const close = (event) => {
        if (event.key === 'Escape' || (event.type === 'pointerdown' && !searchRef.current?.contains(event.target))) {
          setOpenDate(false);
          setOpenOptions(false);
        }
      };
      document.addEventListener('pointerdown', close);
      document.addEventListener('keydown', close);
      return () => {
        document.removeEventListener('pointerdown', close);
        document.removeEventListener('keydown', close);
      };
    }, []);

    const handleOption = (name, operation) => {
      setOptions((prev) => {
        return {
          ...prev,
          [name]: Math.max(name === 'children' ? 0 : 1, prev[name] + (operation === 'i' ? 1 : -1)),
        };
      });
    };

    const handleSearch = (event) => {
      event.preventDefault();
      if (date[0].endDate <= date[0].startDate) {
        setSearchError('Choose a check-out date after check-in.');
        return;
      }
      setSearchError('');
      const city = destination.trim();
      dispatch({type: "NEW_SEARCH", payload: {destination: city, date, options}})
      navigate(`/hotels${city ? `?${new URLSearchParams({ city })}` : ''}`, { state: { destination: city, date, options } });
    };

    const {user} = useContext(AuthContext);


    return (
      <div className="header">
        <div
          className={
            type === "list" ? "headerContainer listMode" : "headerContainer"
          }
        >
          <nav className="headerList" aria-label="Travel services">
            <Link to="/hotels" className="headerListItem active">
              <FaBed />
              <span>Stays</span>
            </Link>
            {[[FaPlane, 'Flights'], [FaCar, 'Car rentals'], [FaBed, 'Attractions'], [FaTaxi, 'Airport taxis']].map(([Icon, label]) => (
              <button type="button" className="headerListItem" key={label} onClick={() => setService(label)}><Icon /><span>{label}</span></button>
            ))}
          </nav>
          {service && <div className="serviceNotice" role="status">{service}: Coming soon. You can book stays today.<button type="button" onClick={() => setService('')} aria-label="Dismiss notice">×</button></div>}
          {type !== "list" && (
            <>
              <h1 className="headerTitle">
                <span style={{color:'white'}}>A lifetime of discounts? </span>It&apos;s right choice !
              </h1>
              <p className="headerDesc">
                Get rewarded for your travels – unlock instant savings of 10% or
                more with a free BookNrest account
              </p>
              {
                !user && <Link to="/login" className="headerBtn">Sign in / Register</Link>
              }
              <form className="headerSearch" ref={searchRef} onSubmit={handleSearch}>
                <div className="headerSearchItem">
                  <FaBed />
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    aria-label="Destination"
                    className="headerSearchInput"
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="headerSearchItem">
                  <FaCalendarDay />
                  <button type="button" aria-label="Choose dates" aria-expanded={openDate}
                    onClick={() => { setOpenDate(!openDate); setOpenOptions(false); }}
                    className="headerSearchText"
                  >{`${format(date[0].startDate, "MM/dd/yyyy")} to ${format(
                    date[0].endDate,
                    "MM/dd/yyyy"
                  )}`}</button>
                  {openDate && (
                    <DateRange
                      editableDateInputs={true}
                      onChange={(item) => setDate([item.selection])}
                      moveRangeOnFirstSelection={false}
                      ranges={date}
                      className="date"
                      minDate={new Date()}
                    />
                  )}
                </div>
                <div className="headerSearchItem">
                  <FaPerson />
                  <button type="button" aria-label="Choose guests and rooms" aria-expanded={openOptions}
                    onClick={() => { setOpenOptions(!openOptions); setOpenDate(false); }}
                    className="headerSearchText"
                  >{`${options.adult} adult · ${options.children} children · ${options.room} room`}</button>
                  {openOptions && (
                    <div className="options">
                      <div className="optionItem">
                        <span className="optionText">Adult</span>
                        <div className="optionCounter">
                          <button
                            type="button" aria-label="Fewer adults"
                            disabled={options.adult <= 1}
                            className="optionCounterButton"
                            onClick={() => handleOption("adult", "d")}
                          >
                            -
                          </button>
                          <span className="optionCounterNumber">
                            {options.adult}
                          </span>
                          <button
                            type="button" aria-label="More adults"
                            className="optionCounterButton"
                            onClick={() => handleOption("adult", "i")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="optionItem">
                        <span className="optionText">Children</span>
                        <div className="optionCounter">
                          <button
                            type="button" aria-label="Fewer children"
                            disabled={options.children <= 0}
                            className="optionCounterButton"
                            onClick={() => handleOption("children", "d")}
                          >
                            -
                          </button>
                          <span className="optionCounterNumber">
                            {options.children}
                          </span>
                          <button
                            type="button" aria-label="More children"
                            className="optionCounterButton"
                            onClick={() => handleOption("children", "i")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="optionItem">
                        <span className="optionText">Room</span>
                        <div className="optionCounter">
                          <button
                            type="button" aria-label="Fewer rooms"
                            disabled={options.room <= 1}
                            className="optionCounterButton"
                            onClick={() => handleOption("room", "d")}
                          >
                            -
                          </button>
                          <span className="optionCounterNumber">
                            {options.room}
                          </span>
                          <button
                            type="button" aria-label="More rooms"
                            className="optionCounterButton"
                            onClick={() => handleOption("room", "i")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="headerSearchItem">
                  <button type="submit" className="headerBtn">
                    Search <FaLongArrowAltRight />
                  </button>
                </div>
              </form>
              {searchError && <div className="searchError" role="alert">{searchError}</div>}
            </>
          )}
        </div>
      </div>
    );
  };

  Header.propTypes = { type: PropTypes.string };
  export default Header;

