import "./navbar.css"
import { FaLongArrowAltRight } from "react-icons/fa";
import {Link} from 'react-router-dom'
import { Logo } from "../../assets";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUser } from "react-icons/fa6";const Navbar = () => {
  const {user} = useContext(AuthContext);

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
        </div>
        : <div className="navContainer">
        <div className="navItems">
          <span>Register</span>
          <button className="navButton">Login <FaLongArrowAltRight /> </button>
        </div>
      </div>
      }
    </div>
  )
}

export default Navbar