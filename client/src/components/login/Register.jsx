import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (fields.password !== fields.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    delete fields.confirmPassword;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/register', fields);
      navigate('/login', { state: { ...location.state, registered: true }, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page register-page">
    <form className="form" onSubmit={submit}>
      <h1>Create an account</h1>
      <label>Username<input name="username" autoComplete="username" required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Country<input name="country" autoComplete="country-name" required /></label>
      <label>City<input name="city" autoComplete="address-level2" required /></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" pattern="[0-9]+" title="Use digits only" required /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" required /></label>
      <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      <Link to="/login" state={location.state}>Already have an account? Log in</Link>
      <Link to="/">Back to home</Link>
    </form>
  </main>;
}
