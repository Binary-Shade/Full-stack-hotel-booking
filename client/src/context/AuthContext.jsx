import { createContext, useContext, useEffect, useReducer } from "react";

// Initial state
const INIT = {
    user: JSON.parse(localStorage.getItem("user")) || null,
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
        localStorage.setItem("user", JSON.stringify(state.user))
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
