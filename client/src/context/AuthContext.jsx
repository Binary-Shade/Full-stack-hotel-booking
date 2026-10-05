import { createContext, useContext, useEffect, useReducer } from "react";

// Initial state
// SECURITY: only non-sensitive display fields are kept, in sessionStorage
// (cleared when the browser closes) instead of the full user in localStorage.
const toSafeUser = (u) => u ? { _id: u._id, username: u.username, img: u.img } : null;

const loadUser = () => {
    try { return JSON.parse(sessionStorage.getItem("user")) } catch { return null }
};

const INIT = {
    user: loadUser(),
    loading: false,
    error: null
};

// Create the context
export const AuthContext = createContext(INIT);

// Reducer function
const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null,
                loading: true,
                error: null
            }
        case "LOGIN_SUCCESS":
            return {
                user: action.payload,
                loading: false,
                error : null
            }
        case "LOGIN_FAILURE":
            return {
                user: null,
                loading: false,
                error : action.payload
            }
        case "LOGOUT":
            return {
                user: null,
                loading: false,
                error : null
            }
        default:
            return state
    }
};


// Context provider component
export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, INIT);
    
    useEffect(()=>{
        if (state.user) {
            sessionStorage.setItem("user", JSON.stringify(state.user))
        } else {
            sessionStorage.removeItem("user")
        }
        localStorage.removeItem("user")   // clean up data saved by the old version
    },[state.user])
    return (
        <AuthContext.Provider
            value={{
                user: state.user,
                loading: state.loading,
                error: state.error,
                dispatch,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use the Auth context
export const useAuthContext = () => {
    return useContext(AuthContext);
};
