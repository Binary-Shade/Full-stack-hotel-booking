import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import List from "./pages/list/List";
import Single from "./pages/single/Single";
import New from "./pages/new/New";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { userInputs, hotelInputs, roomInputs } from "./formSource.jsx";
import "./style/dark.scss";
import { useContext } from "react";
import { DarkModeContext } from "./context/darkModeContext";
import { AuthContext } from "./context/AuthContext.jsx";
import { hotelCols, roomCols, userColumns } from "./datatablesource.jsx";
import NewHotel from './pages/newHotel/NewHotel'
import NewRoom from './pages/newRoom/NewRoom.jsx'

function App() {
  const { darkMode } = useContext(DarkModeContext);

  // SECURITY: localStorage can be edited by anyone, so it is only a hint.
  // Every protected page asks the server to confirm this session is an admin.
  const ProtectedRoutes = ({ children }) => {
    const { user, dispatch } = useContext(AuthContext);
    const [status, setStatus] = useState(user ? "checking" : "denied");

    useEffect(() => {
      if (!user) return;
      axios.get("/api/auth/admin/verify")
        .then(() => setStatus("ok"))
        .catch(() => {
          dispatch({ type: "LOGOUT" });
          setStatus("denied");
        });
    }, [user, dispatch]);

    if (status === "denied") return <Navigate to="/login" />;
    if (status === "checking") return null;
    return children;
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route path="login" element={<Login />} />
            <Route
              index
              element={
                <ProtectedRoutes>
                  <Home />
                </ProtectedRoutes>
              }
            />
            <Route path="users">
              <Route index 
              element={
              <ProtectedRoutes>
                <List cols={userColumns}/>
              </ProtectedRoutes>
              } />
              <Route path=":userId" 
              element={
                <ProtectedRoutes>
                    <Single />
                </ProtectedRoutes>
                } />
              <Route
                path="new"
                element={<ProtectedRoutes><New inputs={userInputs} title="Add New User" /></ProtectedRoutes> }
              />
            </Route>
            <Route path="hotels">
              <Route index 
              element={
              <ProtectedRoutes>
                <List cols={hotelCols}/>
              </ProtectedRoutes>
              } />
              <Route path=":productId" element={<ProtectedRoutes> <Single /> </ProtectedRoutes>} />
              <Route
                path="new"
                element={<ProtectedRoutes><NewHotel inputs={hotelInputs} title="Add New Hotel" /></ProtectedRoutes>}
              />
            </Route>
            <Route path="rooms">
              <Route index 
              element={
              <ProtectedRoutes>
                <List cols={roomCols}/>
              </ProtectedRoutes>
              } />
              <Route path=":productId" element={<ProtectedRoutes> <Single /> </ProtectedRoutes>} />
              <Route
                path="new"
                element={<ProtectedRoutes><NewRoom inputs={roomInputs} title={'add new room'} /></ProtectedRoutes>}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

