import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';
import './ExpertDashboard.css'

const API = 'http://localhost:5000/api/expert';

function ExpertDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [queries, setQueries] = useState([]);
  const [answers, setAnswers] = useState({});
  const [tab, setTab] = useState('Pending');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  const loadQueries = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/all`);

      if (!res.ok) {
        throw new Error(t('loadQuestionsError'));
      }

      const data = await res.json();

      setQueries(
        Array.isArray(data)
          ? data.filter((q) => q.status !== 'Draft')
          : []
      );
    } catch {
      setError(t('loadQuestionsCatchError') || 'Could not load questions.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const sendAnswer = async (id) => {
    const answerText = (answers[id] || '').trim();

    setError('');
    setNotice('');

    if (!answerText) {
      setError(t('writeAnswerFirstError') || 'Please write an answer first.');
      return;
    }

    setSendingId(id);

    try {
      const res = await fetch(`${API}/answer/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer: answerText,
          expert: user?.id || user?._id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || data.message || t('sendAnswerError') || 'Could not send answer.'
        );
        return;
      }

      setAnswers((previous) => ({
        ...previous,
        [id]: ''
      }));

      setNotice(t('answerSentSuccess') || 'Answer sent successfully!');
      await loadQueries();
    } catch {
      setError(t('connectServerError') || 'Server connection error.');
    } finally {
      setSendingId(null);
    }
  };

  const pending = queries.filter((q) => q.status === 'Pending');
  const answered = queries.filter((q) => q.status === 'Answered');
  const shown = tab === 'Pending' ? pending : answered;

  return (
    <div className="expert-page">
      <FarmerNavbar />

      <main className="expert-container">
        {/* Top Hero Section */}
        <section className="expert-hero">
          <div>
            <span className="expert-eyebrow">{t('agritechExpertDeskCrumb') || 'AGRITECH EXPERT DESK'}</span>
            <h1 className="expert-title">
              {t('welcomeExpertPrefix') || 'Welcome, '}
              {user?.name || t('expertDefaultName') || 'Expert'} 🧑‍🔬
            </h1>
            <p className="expert-subtitle">
              {t('expertDeskSubtitle') || 'Review farmer queries and provide expert agricultural guidance.'}
            </p>
          </div>
          <div className="expert-hero-badge">🌾 Expert Advisory</div>
        </section>

        {/* Overview Stats */}
        <section className="expert-stats">
          <article className="expert-stat-card">
            <div className="expert-stat-icon-wrap">📩</div>
            <div>
              <div className="expert-stat-label">
                {t('pendingQuestionsLabel') || 'Pending Queries'}
              </div>
              <div className="expert-stat-number">
                {pending.length}
              </div>
            </div>
          </article>

          <article className="expert-stat-card">
            <div className="expert-stat-icon-wrap">✅</div>
            <div>
              <div className="expert-stat-label">
                {t('answeredQuestionsLabel') || 'Answered Queries'}
              </div>
              <div className="expert-stat-number">
                {answered.length}
              </div>
            </div>
          </article>
        </section>

        {error && (
          <div className="expert-alert expert-alert-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="expert-alert expert-alert-success" role="status">
            {notice}
          </div>
        )}

        {/* Questions Section */}
        <section className="expert-questions-section">
          <div className="expert-toolbar">
            <div className="expert-tabs">
              {['Pending', 'Answered'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`expert-tab ${
                    tab === item ? 'active' : ''
                  }`}
                  onClick={() => setTab(item)}
                >
                  {item === 'Pending'
                    ? t('pendingTab') || 'Pending'
                    : t('answeredTab') || 'Answered'}
                  <span className="expert-tab-count">
                    {item === 'Pending'
                      ? pending.length
                      : answered.length}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="expert-refresh-btn"
              onClick={loadQueries}
              disabled={loading}
            >
              <span aria-hidden="true">↻</span>
              {loading
                ? t('refreshingBtnText') || 'Refreshing...'
                : t('refreshBtnText') || 'Refresh'}
            </button>
          </div>

          {loading && (
            <div className="expert-empty-state">
              <span className="expert-loader" />
              <p>{t('loadingQuestionsText') || 'Loading queries...'}</p>
            </div>
          )}

          {!loading && shown.length === 0 && (
            <div className="expert-empty-state">
              <div className="expert-empty-icon">
                {tab === 'Pending' ? '📭' : '🌿'}
              </div>
              <p>
                {tab === 'Pending'
                  ? t('noPendingQuestionsText') || 'No pending questions found.'
                  : t('noAnsweredQuestionsText') || 'No answered questions found.'}
              </p>
            </div>
          )}

          <div className="expert-question-list">
            {shown.map((q) => (
              <article className="expert-question-card" key={q._id}>
                <div className="expert-question-top">
                  <div className="expert-question-heading">
                    <span
                      className={`expert-status ${
                        q.status === 'Pending'
                          ? 'status-pending'
                          : 'status-answered'
                      }`}
                    >
                      {q.status === 'Pending'
                        ? t('pendingTab') || 'Pending'
                        : t('answeredTab') || 'Answered'}
                    </span>

                    <h3>
                      {q.subject || t('untitledQuestion') || 'Untitled Query'}
                    </h3>
                  </div>

                  <div className="expert-question-meta">
                    <span>
                      👤 {q.farmer?.name || t('farmerRoleDefault') || 'Farmer'}
                    </span>
                    <span>
                      📅{' '}
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString()
                        : t('dateUnavailable') || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="expert-question-body">
                  <p>{q.question}</p>
                </div>

                {q.status === 'Pending' ? (
                  <div className="expert-answer-area">
                    <label
                      className="expert-answer-label"
                      htmlFor={`answer-${q._id}`}
                    >
                      {t('sendAnswerBtnText') || 'Provide Answer'}
                    </label>

                    <textarea
                      id={`answer-${q._id}`}
                      rows={4}
                      className="expert-answer-input"
                      placeholder={t('answerPlaceholder') || 'Write your professional advice here...'}
                      value={answers[q._id] || ''}
                      onChange={(e) =>
                        setAnswers((previous) => ({
                          ...previous,
                          [q._id]: e.target.value
                        }))
                      }
                      disabled={sendingId === q._id}
                    />

                    <div className="expert-answer-footer">
                      <button
                        type="button"
                        className="expert-submit-btn"
                        disabled={sendingId === q._id}
                        onClick={() => sendAnswer(q._id)}
                      >
                        {sendingId === q._id
                          ? t('sendingBtnText') || 'Sending...'
                          : `✓ ${t('sendAnswerBtnText') || 'Send Answer'}`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="expert-answer-display">
                    <strong>✓ {t('yourAnswerLabel') || 'Your Answer:'}</strong>
                    <p>
                      {q.answer || t('noAnswerTextAvailable') || 'No answer recorded.'}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ExpertDashboard;