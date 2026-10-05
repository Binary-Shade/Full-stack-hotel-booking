import { useContext, useState } from 'react'
import './login.css'
import { AuthContext } from '../../context/AuthContext'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
    const [credentials, setCredentials] = useState({
        username: undefined,
        password: undefined
    })
    const navigate = useNavigate()
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
            navigate('/')
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
            navigate('/')
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
            <form className='form'>
            <h2 className='head'>LOG IN</h2>
            <input type="text"
                placeholder='username'
                id='username'
                className='lInput'
                onChange={handleChange}
            />
            <input type="password"
                placeholder='password'
                id='password'
                className='lInput'
                onChange={handleChange}
            />
            <button disabled={loading} onClick={handleSubmit} className='lButton'>Log in</button>

            <div style={{ margin: '16px 0', textAlign: 'center' }}>— or —</div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                />
            </div>

            {
    error && <span className='error'>{error.message || "An error occurred during login"}</span>
}
            </form>

        </div>
    </div>
  )
}

export default Login
