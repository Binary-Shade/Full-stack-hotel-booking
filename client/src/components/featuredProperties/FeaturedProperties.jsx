import useFetch from "../../hooks/useFetch";
import "./featuredProperties.css";
import { FaStar } from "react-icons/fa";

const FeaturedProperties = () => {
  const {data, loading, error} = useFetch('/api/hotels?featured=true&limit=4')

  return (
    <div className="fp">
      {
        loading ? "Loading" : (<>
          {
            data.map((item)=>(
              <div className="fpItem" key={item._id}>
            <img
              src={item.photos[0]}
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
          </div>
            ))
          }
        </>)
      }
    </div>
  );
};

export default FeaturedProperties;
