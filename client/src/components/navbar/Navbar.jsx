import "./navbar.css"
import { FaLongArrowAltRight } from "react-icons/fa";
import { Logo } from "../../assets";
const Navbar = () => {
  return (
    <div className="navbar">
        <img src={Logo} width={'30px'} height={'30px'} alt="" />
      <div className="navContainer">
        <span className="logo">Book My <span style={{color: 'yellow'}}>Room</span></span>
        <div className="navItems">
          <span>Register</span>
          <button className="navButton">Login <FaLongArrowAltRight /> </button>
        </div>
      </div>
    </div>
  )
}

export default Navbar