import "./featured.css";
import useFetch from '../../hooks/useFetch.js'

const Featured = () => {
  const cities = ['chennai', 'london', 'banglore']
  const {data, loading, error} = useFetch(`/api/hotels/countByCity?cities=${cities[0]},${cities[1]},${cities[2]}`)
  return (
    <div className="featured">
      {
        loading ? (
         <p>loading ..</p>
        ): (
          <>
            <div className="featuredItem">
            <img
              src="https://t4.ftcdn.net/jpg/07/16/02/27/240_F_716022764_IibK5ccxjjhtug7eryYacL9aMnXcWDmc.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>{cities[0]}</h1>
              <h2>{data[0]} properties</h2>
            </div>
          </div>
            <div className="featuredItem">
            <img
              src="https://www.visa.co.in/content/dam/VCOM/regional/ap/images/travel-with-visa/london/travel-london-history-museum-800x450.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>{cities[1]}</h1>
              <h2>{data[1]} properties</h2>
            </div>
          </div>
            <div className="featuredItem">
            <img
              src="https://t4.ftcdn.net/jpg/04/73/43/49/240_F_473434911_E66W25m5p8VlMBMNOaKYETGIY4mXK2n0.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>{cities[2]}</h1>
              <h2>{data[2]} properties</h2>
            </div>
          </div>
        </>
        )
      }
    </div>
  );
};

export default Featured;
