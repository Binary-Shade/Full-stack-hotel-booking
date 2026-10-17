import "./navbar.css"
import { FaLongArrowAltRight } from "react-icons/fa";
import {Link} from 'react-router-dom'
import { Logo } from "../../assets";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useState } from "react";
import { FaUser } from "react-icons/fa6";const Navbar = () => {
  const {user, dispatch} = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    setError('');
    try {
      await axios.post('/api/auth/logout');
      dispatch({ type: 'LOGOUT' });
    } catch {
      setError('Unable to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="navbar">
      <Link to={'/'}>
        <div className="name">
        <img src={Logo} width={'30px'} height={'30px'} alt="" />
        <span className="logo" style={{fontWeight:"700"}}>Book<span style={{color: 'white', fontWeight:'700', margin:'5px'}}>N</span>Rest</span>
        </div>
      </Link>
      {
        user ? <div className="navContainer">
          <div className="profile">
            <FaUser />
        <span>{user.username}</span>
      </div>
          <button className="navButton" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Logging out...' : 'Log out'}</button>
          {error && <span role="alert">{error}</span>}
        </div>
        : <div className="navContainer">
        <div className="navItems">
          <Link to="/register" className="navRegister">Register</Link>
          <Link to="/login" className="navButton">Login <FaLongArrowAltRight /> </Link>
        </div>
      </div>
      }
    </div>
  )
}

export default Navbar
