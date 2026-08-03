import React from 'react';

const AIChatTutor = ({ 
  chatTab, setChatTab, 
  aiMessages, classroomMessages, 
  isAiTyping, inputValue, setInputValue, 
  handleSendMessage, messagesEndRef 
}) => {
  return (
    <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Chat Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexShrink: 0 }}>
        <button 
          onClick={() => setChatTab('ai')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: chatTab === 'ai' ? 'rgba(124, 58, 237, 0.2)' : 'transparent', border: `1px solid ${chatTab === 'ai' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, color: chatTab === 'ai' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.3s' }}>
          <i className="fa-solid fa-robot"></i> AI Tutor
        </button>
        <button 
          onClick={() => setChatTab('classroom')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: chatTab === 'classroom' ? 'rgba(14, 165, 233, 0.2)' : 'transparent', border: `1px solid ${chatTab === 'classroom' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`, color: chatTab === 'classroom' ? 'var(--secondary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.3s' }}>
          <i className="fa-solid fa-users"></i> Classroom
        </button>
      </div>

      <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', minHeight: 0 }}>
        
        {chatTab === 'classroom' ? (
          <>
            {classroomMessages.map(msg => (
              <div key={msg.id} style={{ background: msg.sender === 'Teacher' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', alignSelf: msg.sender === 'Teacher' ? 'flex-start' : 'flex-end', maxWidth: '90%', border: msg.sender === 'Teacher' ? '1px solid rgba(124, 58, 237, 0.3)' : 'none' }}>
                <span style={{ color: msg.sender === 'Teacher' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', display: 'block', fontSize: '0.8rem', textAlign: msg.sender === 'Teacher' ? 'left' : 'right' }}>
                  {msg.sender === 'Teacher' ? `👨‍🏫 ${msg.senderName}` : msg.senderName}
                </span>
                {msg.text}
              </div>
            ))}
          </>
        ) : (
          <>
            {aiMessages.map((msg, idx) => (
              <div key={idx} style={{ background: msg.sender === 'ai' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '90%', border: msg.sender === 'ai' ? '1px solid rgba(14, 165, 233, 0.3)' : 'none' }}>
                <span style={{ color: msg.sender === 'ai' ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 'bold', display: 'block', fontSize: '0.8rem', textAlign: msg.sender === 'ai' ? 'left' : 'right', marginBottom: '3px' }}>
                  {msg.sender === 'ai' ? <><i className="fa-solid fa-robot"></i> AI Tutor</> : 'You'}
                </span>
                {msg.text}
              </div>
            ))}
            {isAiTyping && (
              <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--secondary)', animation: 'pulse 1s infinite' }}>
                <i className="fa-solid fa-robot"></i> AI is typing...
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={chatTab === 'ai' ? "Ask the AI Tutor a question..." : "Message classroom..."} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
        />
        <button type="submit" className={chatTab === 'ai' ? "btn btn-secondary" : "btn btn-primary"} style={{ padding: '10px 15px' }}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default AIChatTutor;
