
import { useEffect, useRef, useState } from 'react';
import './AICropDoctor.css';

const QUICK_QUESTIONS = [
  'Yellow leaves on wheat',
  'Pest control for cotton',
  'Best fertilizer for paddy',
  'Water irrigation',
  'Weather advice'
];

function getCropAdvice(question) {
  const q = question.toLowerCase();

  if (q.includes('yellow') || q.includes('pila')) {
    return {
      title: 'Yellow Leaves — Crop Guidance',
      symptoms:
        'Yellow leaves may indicate nitrogen deficiency, excess water, poor drainage or a disease. Check which leaves are affected and the soil moisture.',
      organic:
        'Use well-decomposed compost when suitable. Maintain proper drainage and avoid unnecessary watering.',
      treatment:
        'Nitrogen deficiency is only one possibility. Check soil nutrients before choosing fertilizer; follow local agricultural recommendations.',
      next:
        'Which crop is affected, and are the older or newer leaves turning yellow?'
    };
  }

  if (
    q.includes('pest') ||
    q.includes('insect') ||
    q.includes('keede')
  ) {
    return {
      title: 'Pest Management',
      symptoms:
        'Inspect leaves and stems for insects, holes, eggs or sticky residue. Identify the pest before choosing a treatment.',
      organic:
        'Neem-based products may help against certain pests when labelled for your crop. Follow the product label and local agricultural guidance.',
      treatment:
        'Use only a pesticide registered for the identified pest and crop. Follow label directions and protective precautions.',
      next:
        'Tell me your crop name and describe the insect or damage you can see.'
    };
  }

  if (
    q.includes('fertilizer') ||
    q.includes('khad') ||
    q.includes('npk')
  ) {
    return {
      title: 'Fertilizer & Soil Health',
      symptoms:
        'Nutrient needs depend on the crop, growth stage and soil condition. NPK provides nitrogen, phosphorus and potassium.',
      organic:
        'Well-decomposed compost or farmyard manure can support soil health when suitable.',
      treatment:
        'There is no single NPK ratio suitable for every crop. Use soil-test results and local crop recommendations to select fertilizer and dosage.',
      next:
        'Tell me your crop, crop age and soil-test results if available.'
    };
  }

  if (
    q.includes('water') ||
    q.includes('irrigation') ||
    q.includes('pani')
  ) {
    return {
      title: 'Water & Irrigation Advice',
      symptoms:
        'Both insufficient water and waterlogging can affect crop growth. Check soil moisture, drainage and recent rainfall.',
      organic:
        'Water near the root zone when appropriate, maintain drainage and consider mulching where suitable.',
      treatment:
        'Irrigation timing depends on crop type, growth stage, soil and weather. Avoid following a fixed schedule without checking conditions.',
      next:
        'Which crop are you growing, and when was it last watered?'
    };
  }

  if (
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('mausam')
  ) {
    return {
      title: 'Weather & Crop Protection',
      symptoms:
        'Rain, heat, wind and humidity can affect crop health and disease risk.',
      organic:
        'Keep field drainage clear and inspect crops after heavy rain or unusual weather.',
      treatment:
        'Check your local weather forecast before irrigation or spraying. Avoid spraying in unsuitable weather conditions.',
      next:
        'Tell me your location and crop name for more relevant guidance.'
    };
  }

  return {
    title: 'Agricultural Guidance',
    symptoms:
      'A reliable recommendation requires understanding the crop, visible symptoms, crop age and growing conditions.',
    organic:
      'Check soil moisture, drainage and plant condition. Use compost or other organic inputs only when appropriate.',
    treatment:
      'Avoid applying chemicals or fertilizer blindly. Confirm the likely cause and follow local agricultural expert advice.',
    next:
      'Please share your crop name, location, crop age and the problem you are seeing.'
  };
}

function AICropDoctor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: 'Namaste! 🌱 I am AgriBot, your AI Crop Doctor. Ask me about yellow leaves, pests, fertilizer, irrigation or weather.'
    }
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, typing]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  function sendMessage(value) {
    const question = value.trim();

    if (!question || typing) return;

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: 'user',
        text: question
      }
    ]);

    setInput('');
    setTyping(true);

    timerRef.current = setTimeout(() => {
      const advice = getCropAdvice(question);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'bot',
          advice
        }
      ]);

      setTyping(false);
    }, 1000);
  }

  return (
    <section className="crop-doctor">
      <header className="crop-doctor-header">
        <div className="crop-doctor-brand">
          <div className="crop-doctor-logo">🤖</div>

          <div>
            <h2>AI Crop Doctor</h2>
            <p>Your Smart Farming Assistant</p>
          </div>
        </div>

        <div className="crop-doctor-online">
          <span className="online-dot" />
          Online
        </div>
      </header>

      <div className="crop-doctor-intro">
        <span className="crop-doctor-eyebrow">
          AGRICULTURE ASSISTANT
        </span>
        <h3>How can I help your crops today?</h3>
        <p>Ask a question and get instant farming guidance.</p>
      </div>

      <div className="crop-doctor-chat" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`crop-message ${
              message.role === 'user'
                ? 'crop-message-user'
                : 'crop-message-bot'
            }`}
          >
            {message.role === 'bot' && (
              <div className="crop-message-avatar">🌿</div>
            )}

            <div className="crop-message-content">
              {message.text && <p>{message.text}</p>}

              {message.advice && (
                <div className="crop-advice">
                  <h4>🌾 {message.advice.title}</h4>

                  <div className="crop-advice-block">
                    <strong>🔎 Symptoms to check</strong>
                    <p>{message.advice.symptoms}</p>
                  </div>

                  <div className="crop-advice-block">
                    <strong>🍃 Organic remedy</strong>
                    <p>{message.advice.organic}</p>
                  </div>

                  <div className="crop-advice-block">
                    <strong>🧪 Treatment guidance</strong>
                    <p>{message.advice.treatment}</p>
                  </div>

                  <div className="crop-advice-followup">
                    {message.advice.next}
                  </div>

                  <small>
                    Demo guidance only. This is not a confirmed crop diagnosis.
                  </small>
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="crop-message crop-message-bot">
            <div className="crop-message-avatar">🌿</div>

            <div className="crop-typing">
              <span />
              <span />
              <span />
              <p>AI is analyzing crop symptoms...</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="crop-doctor-quick">
        <p className="crop-quick-heading">QUICK QUESTIONS</p>

        <div className="crop-quick-list">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              disabled={typing}
              onClick={() => sendMessage(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <form
        className="crop-doctor-input-area"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your crop..."
          aria-label="Ask AI Crop Doctor"
          disabled={typing}
        />

        <button
          type="submit"
          disabled={!input.trim() || typing}
        >
          Send ➤
        </button>
      </form>

      <p className="crop-doctor-disclaimer">
        For crop-specific treatment, consult a qualified local agricultural expert.
      </p>
    </section>
  );
}

export default AICropDoctor;
