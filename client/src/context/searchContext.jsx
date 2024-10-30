import { createContext, useContext, useReducer } from "react";

// Initial state
const INIT = {
    city: undefined,
    date: [],
    options: {
        adult: undefined,
        children: undefined,
        room: undefined,
    },
};

// Create the context
export const SearchContext = createContext(INIT);

// Reducer function with localStorage persistence
const searchReducer = (state, action) => {
    switch (action.type) {
        case "NEW_SEARCH":
            const newState = action.payload;
            localStorage.setItem("searchState", JSON.stringify(newState)); // Save state to localStorage
            return newState;
        case "RESET_SEARCH":
            localStorage.removeItem("searchState"); // Clear state from localStorage
            return INIT;
        default:
            return state;
    }
};

export const SearchContextProvider = ({ children }) => {
    let initialState = INIT;

    try {
        const savedState = localStorage.getItem("searchState");
        if (savedState) {
            initialState = JSON.parse(savedState);
        }
    } catch (error) {
        console.error("Failed to parse search state from localStorage:", error);
        localStorage.removeItem("searchState"); // Remove corrupted data
    }

    const [state, dispatch] = useReducer(searchReducer, initialState);

    return (
        <SearchContext.Provider
            value={{
                city: state.city,
                date: state.date,
                options: state.options,
                dispatch,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};


// Hook to use the search context
export const useSearchContext = () => {
    return useContext(SearchContext);
};
