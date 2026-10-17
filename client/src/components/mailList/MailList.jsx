import "./mailList.css"
import { useState } from 'react';

const MailList = () => {
  const [message, setMessage] = useState('');
  return (
    <div className="mail">
      <h1 className="mailTitle">Save time, save money!</h1>
      <span className="mailDesc">Subscribe to the newsletter for travel deals.</span>
      <form className="mailInputContainer" onSubmit={event => { event.preventDefault(); setMessage('Newsletter subscriptions are coming soon.'); }}>
        <input type="email" aria-label="Newsletter email" placeholder="Your Email" required />
        <button type="submit">Subscribe</button>
      </form>
      {message && <div role="status">{message}</div>}
    </div>
  )
}

export default MailList
