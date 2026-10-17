import { useContext, useState } from 'react'
import './login.css'
import { AuthContext } from '../../context/AuthContext'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
    const [credentials, setCredentials] = useState({
        username: undefined,
        password: undefined
    })
    const navigate = useNavigate()
    const location = useLocation()
    const requestedPath = location.state?.returnTo;
    const returnTo = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
    const { loading, error, dispatch} = useContext(AuthContext);

    const handleChange = (e) =>{
        setCredentials((prev)=>(
            {...prev ,[e.target.id]: e.target.value}
        ));
    }
    
    const handleSubmit = async (e) =>{
        e.preventDefault();
        dispatch({type: "LOGIN_START"});
        try {
            const response = await axios.post('/api/auth/login', credentials);
            dispatch({type: "LOGIN_SUCCESS", payload: response.data.details});
            navigate(returnTo, { replace: true })
        } catch (error) {
            console.error("Login error:", error);
            dispatch({type: "LOGIN_FAILURE", payload: error.response?.data || "Something went wrong"});
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        dispatch({type: "LOGIN_START"});
        try {
            const response = await axios.post('/api/auth/google', {
                credential: credentialResponse.credential
            });
            dispatch({type: "LOGIN_SUCCESS", payload: response.data.details});
            navigate(returnTo, { replace: true })
        } catch (error) {
            console.error("Google login error:", error);
            dispatch({type: "LOGIN_FAILURE", payload: error.response?.data || "Google login failed"});
        }
    }

    const handleGoogleError = () => {
        dispatch({type: "LOGIN_FAILURE", payload: {message: "Google login was cancelled or failed"}});
    }
    
  return (
    <div className='login-page'>
        <div className='container'>
            <form className='form' onSubmit={handleSubmit}>
            <h2 className='head'>LOG IN</h2>
            {location.state?.registered && <div role="status">Account created. Please log in.</div>}
            <input type="text"
                aria-label="Username" autoComplete="username" required
                placeholder='username'
                id='username'
                className='lInput'
                onChange={handleChange}
            />
            <input type="password"
                aria-label="Password" autoComplete="current-password" required
                placeholder='password'
                id='password'
                className='lInput'
                onChange={handleChange}
            />
            <button type="submit" disabled={loading} className='lButton'>{loading ? 'Logging in...' : 'Log in'}</button>

            <div style={{ margin: '16px 0', textAlign: 'center' }}>— or —</div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                />}
            </div>

            {
    error && <span className='error' role="alert">{error.message || "An error occurred during login"}</span>
}
            <Link to="/register" state={{ returnTo }}>Create an account</Link>
            <Link to="/">Back to home</Link>
            </form>

        </div>
    </div>
  )
}

export default Login
