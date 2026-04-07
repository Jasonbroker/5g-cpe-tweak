import { useEffect, useState } from 'react'
import { smsApi, type SmsMessage } from '../api'

export default function SMS() {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [to, setTo] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      const res = await smsApi.getList()
      if (res.data.data) {
        setMessages(res.data.data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!to.trim() || !body.trim()) return
    setSending(true)
    try {
      await smsApi.send(to.trim(), body.trim())
      setTo('')
      setBody('')
      await fetchMessages()
    } catch (err) {
      console.error('Failed to send SMS:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <h2>SMS</h2>
      
      <div className="card">
        <h3>Send SMS</h3>
        <div className="send-form">
          <input
            type="text"
            placeholder="To..."
            value={to}
            onChange={e => setTo(e.target.value)}
          />
          <textarea
            placeholder="Message..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
          />
          <button onClick={handleSend} disabled={sending || !to.trim() || !body.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Messages ({messages.length})</h3>
        {messages.length === 0 ? (
          <p className="empty">No messages</p>
        ) : (
          <div className="message-list">
            {messages.map(msg => (
              <div key={msg.index} className={`message ${msg.read ? 'read' : 'unread'}`}>
                <div className="message-header">
                  <span className="from">{msg.from}</span>
                  <span className="time">{msg.timestamp}</span>
                </div>
                <div className="message-body">{msg.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .send-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .send-form input, .send-form textarea {
          width: 100%;
        }
        .message-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .message {
          padding: 0.75rem;
          background: #2a2a2a;
          border-radius: 6px;
          border-left: 3px solid #646cff;
        }
        .message.unread {
          border-left-color: #ff6b6b;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .from {
          font-weight: 500;
        }
        .time {
          font-size: 0.75rem;
          color: #666;
        }
        .message-body {
          font-size: 0.9rem;
          color: #aaa;
        }
        .empty {
          color: #666;
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  )
}
