import useFetch from "../../hooks/useFetch";
import { Link } from "react-router-dom";
import "./featuredProperties.css";
import { FaStar } from "react-icons/fa";

const FeaturedProperties = () => {
  const {data, loading, error} = useFetch('/api/hotels?featured=true&limit=4')

  if (error || !Array.isArray(data)) {
    return <div className="fp" role="alert">Unable to load featured properties. Please try again later.</div>;
  }

  return (
    <div className="fp">
      {
        loading ? "Loading" : (<>
          {
            data.map((item)=>(
              <Link to={`/hotels/${item._id}`} className="fpItem" key={item._id}>
            <img
              src={item.photos?.[0]}
              alt={item.name}
              className="fpImg"
            />
            <span className="fpName">{item.name}</span>
            <span className="fpCity">{item.city}</span>
            <span className="fpPrice">{item.cheapestPrice}</span>
            <div className="fpRating">
              <div className="whole">
              <p>8.9</p>
              <FaStar className="star"/>
              </div>
              <span className="spanner">Excellent</span>
            </div>
          </Link>
            ))
          }
        </>)
      }
    </div>
  );
};

export default FeaturedProperties;
