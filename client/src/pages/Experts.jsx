
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';

const API = 'http://localhost:5000/api/expert';

const EMPTY = { subject: '', question: '' };

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 55%, #ecfdf5 100%)',
    color: '#173b2a',
    fontFamily: 'Arial, sans-serif',
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 1150,
    margin: '0 auto',
    padding: '30px 20px',
    boxSizing: 'border-box',
  },
  header: {
    background: 'linear-gradient(135deg, #14532d, #15803d)',
    color: '#fff',
    borderRadius: 22,
    padding: '30px 28px',
    marginBottom: 24,
    boxShadow: '0 12px 30px rgba(22,101,52,0.15)',
  },
  crumb: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: '#bbf7d0',
    marginBottom: 12,
  },
  title: {
    fontSize: 'clamp(26px, 4vw, 36px)',
    fontWeight: 800,
    margin: '0 0 12px',
  },
  subtitle: {
    color: '#dcfce7',
    fontSize: 15,
    lineHeight: 1.7,
    margin: 0,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 26,
  },
  stat: {
    background: '#fff',
    border: '1px solid #dcfce7',
    borderRadius: 16,
    padding: '22px',
    boxShadow: '0 5px 18px rgba(22,101,52,0.06)',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 800,
    color: '#15803d',
  },
  panel: {
    background: '#fff',
    border: '1px solid #dcfce7',
    borderRadius: 20,
    padding: '26px',
    marginBottom: 30,
    boxShadow: '0 8px 24px rgba(22,101,52,0.06)',
  },
  sectionTitle: {
    color: '#14532d',
    fontSize: 21,
    fontWeight: 800,
    margin: '0 0 22px',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 11,
    background: '#fff',
    color: '#173b2a',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 10,
    padding: '12px 20px',
    background: '#15803d',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #15803d',
    borderRadius: 10,
    padding: '12px 20px',
    background: '#f0fdf4',
    color: '#166534',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid #fecaca',
    borderRadius: 9,
    padding: '9px 13px',
    background: '#fff1f2',
    color: '#be123c',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  card: {
    background: '#fff',
    border: '1px solid #dcfce7',
    borderRadius: 17,
    padding: 22,
    boxShadow: '0 5px 18px rgba(22,101,52,0.05)',
    minWidth: 0,
  },
  muted: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 1.6,
  },
  empty: {
    background: '#fff',
    border: '1px dashed #86efac',
    borderRadius: 15,
    padding: 26,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.7,
  },
  message: {
    padding: '13px 16px',
    borderRadius: 11,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 1.6,
  },
};

const statusStyles = {
  Draft: { background: '#fef3c7', color: '#92400e' },
  Pending: { background: '#dbeafe', color: '#1d4ed8' },
  Answered: { background: '#dcfce7', color: '#166534' },
};

function Experts() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  const [queries, setQueries] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setQueries([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/farmer/${userId}`);

      if (!res.ok) {
        throw new Error('Could not load your questions.');
      }

      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Could not load your questions. Please check whether the server is running.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const save = async (isFinal) => {
    setError('');
    setNotice('');

    if (!form.subject.trim() || !form.question.trim()) {
      setError('Please fill in both the subject and your question.');
      return;
    }

    if (!userId) {
      setError('Please log in again to submit your question.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer: userId,
          subject: form.subject.trim(),
          question: form.question.trim(),
          isFinal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not save your question.');
        return;
      }

      setForm(EMPTY);
      setNotice(
        isFinal
          ? 'Your question has been sent to the expert.'
          : 'Your question has been saved as a draft.'
      );

      await load();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = async (id) => {
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${API}/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFinal: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Could not submit the draft.');
        return;
      }

      setNotice('Your question has been sent to the expert.');
      await load();
    } catch {
      setError('Could not reach the server.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this question?')) return;

    setError('');
    setNotice('');

    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Could not delete the question.');
        return;
      }

      setNotice('Question deleted successfully.');
      await load();
    } catch {
      setError('Could not reach the server.');
    }
  };

  const count = (status) =>
    queries.filter((q) => q.status === status).length;

  return (
    <div style={styles.page}>
      <FarmerNavbar />

      <main style={styles.container}>
        <header style={styles.header}>
          <div style={styles.crumb}>AGRITECH / EXPERT CONSULTATION</div>
          <h1 style={styles.title}>Ask an Expert 🧑‍🔬</h1>
          <p style={styles.subtitle}>
            Get help with crop problems, farming methods, and agricultural
            questions from an expert.
          </p>
        </header>

        <section style={styles.stats}>
          {[
            { label: 'Waiting for an answer', value: count('Pending'), icon: '⏳' },
            { label: 'Answered questions', value: count('Answered'), icon: '✅' },
            { label: 'Saved drafts', value: count('Draft'), icon: '📝' },
          ].map((item) => (
            <div style={styles.stat} key={item.label}>
              <div style={{ fontSize: 23, marginBottom: 12 }}>{item.icon}</div>
              <div style={styles.statLabel}>{item.label}</div>
              <div style={styles.statNumber}>{item.value}</div>
            </div>
          ))}
        </section>

        {error && (
          <div
            role="alert"
            style={{
              ...styles.message,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              ...styles.message,
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#166534',
            }}
          >
            {notice}
          </div>
        )}

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>✍️ Ask a new question</h2>

          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={styles.label} htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                style={styles.input}
                placeholder="e.g. Yellow leaves on my wheat"
                value={form.subject}
                onChange={handleChange}
                maxLength={150}
              />
            </div>

            <div>
              <label style={styles.label} htmlFor="question">
                Describe your question
              </label>
              <textarea
                id="question"
                name="question"
                rows={5}
                style={{ ...styles.input, resize: 'vertical', lineHeight: 1.7 }}
                placeholder="Mention your crop, the problem, how long it has been happening, and what you have tried."
                value={form.question}
                onChange={handleChange}
                maxLength={5000}
              />
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              style={{
                ...styles.primaryButton,
                opacity: saving ? 0.65 : 1,
              }}
              disabled={saving}
              onClick={() => save(true)}
            >
              {saving ? 'Please wait...' : '📨 Send to expert'}
            </button>

            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                opacity: saving ? 0.65 : 1,
              }}
              disabled={saving}
              onClick={() => save(false)}
            >
              💾 Save as draft
            </button>
          </div>
        </section>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
            📋 Your questions
          </h2>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {loading && (
          <div style={styles.empty}>Loading your questions...</div>
        )}

        {!loading && queries.length === 0 && !error && (
          <div style={styles.empty}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🌱</div>
            <strong style={{ color: '#166534', fontSize: 17 }}>
              No questions yet
            </strong>
            <p style={{ margin: '8px 0 0' }}>
              Submit your first farming question using the form above.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gap: 18 }}>
          {queries.map((q) => (
            <article key={q._id} style={styles.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      color: '#14532d',
                      fontSize: 19,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {q.subject}
                  </h3>

                  <div style={styles.muted}>
                    Asked on{' '}
                    {q.createdAt
                      ? new Date(q.createdAt).toLocaleDateString()
                      : 'Date unavailable'}
                  </div>
                </div>

                <span
                  style={{
                    display: 'inline-block',
                    padding: '7px 12px',
                    borderRadius: 30,
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    ...(statusStyles[q.status] || statusStyles.Pending),
                  }}
                >
                  {q.status || 'Pending'}
                </span>
              </div>

              <div
                style={{
                  color: '#334155',
                  fontSize: 15,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  marginBottom: 16,
                }}
              >
                {q.question}
              </div>

              {q.status === 'Answered' && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 13,
                    padding: 18,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      color: '#15803d',
                      fontSize: 14,
                      fontWeight: 800,
                      marginBottom: 9,
                    }}
                  >
                    ✅ Expert's answer
                  </div>

                  <div
                    style={{
                      color: '#334155',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {q.answer || 'No answer text is available yet.'}
                  </div>
                </div>
              )}

              {q.status === 'Pending' && (
                <div
                  style={{
                    ...styles.muted,
                    background: '#eff6ff',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 14,
                  }}
                >
                  ⏳ Your question is waiting for an expert's response.
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 12,
                }}
              >
                {q.status === 'Draft' && (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => submitDraft(q._id)}
                  >
                    📨 Send to expert
                  </button>
                )}

                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => remove(q._id)}
                >
                  🗑 Delete question
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Experts;