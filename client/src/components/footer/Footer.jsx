import './footer.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const groups = [
  ['Countries', 'Regions', 'Cities', 'Districts', 'Airports', 'Hotels'],
  ['Homes', 'Apartments', 'Resorts', 'Villas', 'Hostels', 'Guest houses'],
  ['Unique places to stay', 'Reviews', 'Unpacked: Travel articles', 'Travel communities', 'Seasonal and holiday deals'],
  ['Car rental', 'Flight Finder', 'Restaurant reservations', 'Travel Agents'],
  ['Customer Service', 'Partner Help', 'Careers', 'Sustainability', 'Press center', 'Safety Resource Center', 'Investor relations', 'Terms & conditions'],
];
const destinations = {
  Cities: '/hotels', Hotels: '/hotels?type=hotel', Homes: '/hotels',
  Apartments: '/hotels?type=apartment', Resorts: '/hotels?type=resort',
  Villas: '/hotels?type=villa', Hostels: '/hotels?type=hostel', 'Guest houses': '/hotels?type=guest+house',
  'Unique places to stay': '/hotels',
};

const Footer = () => {
  const [notice, setNotice] = useState('');
  return <footer className="footer">
    <nav className="fLists" aria-label="Explore Book N Rest">
      {groups.map((group, index) => <ul className="fList" key={index}>
        {group.map(label => <li className="fListItem" key={label}>
          {destinations[label] ? <Link to={destinations[label]}>{label}</Link>
            : <button type="button" onClick={() => setNotice(label + ': Coming soon.')}>{label}</button>}
        </li>)}
      </ul>)}
    </nav>
    {notice && <div className="footerNotice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss footer notice">×</button></div>}
    <div className="fText">Copyright &copy; {new Date().getFullYear()} BookNRest</div>
  </footer>;
};

export default Footer;
