
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FarmerNavbar from '../components/FarmerNavbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:5000/api/community';

function getUserId(user) {
  return user?._id || user?.id || user?.userId || user?.user?._id || '';
}

function getDisplayName(person) {
  if (!person) return 'Community member';

  if (typeof person === 'string') return 'Community member';

  return person.name || person.fullName || 'Community member';
}

function formatDate(date) {
  if (!date) return 'Date unavailable';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getErrorMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

function Community() {
  const { user } = useAuth();
 const { t, language } = useLanguage();
  const currentUserId = getUserId(user);
  const currentUserName = getDisplayName(user);
  const currentRole = String(user?.role || 'Member');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('feed');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [editingPostId, setEditingPostId] = useState('');

  const [commentInputs, setCommentInputs] = useState({});
  const [commentingPostId, setCommentingPostId] = useState('');

  const [expandedComments, setExpandedComments] = useState({});

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/all`);

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not load community posts.')
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response from the community API.');
      }

      setPosts(data);
    } catch (err) {
      setError(err.message || 'Could not load community posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const myPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          currentUserId &&
          String(
            typeof post.author === 'object'
              ? post.author?._id
              : post.author
          ) === String(currentUserId)
      ),
    [posts, currentUserId]
  );

  const visiblePosts = useMemo(() => {
    let result =
      activeTab === 'mine'
        ? myPosts
        : posts.filter((post) => post.status === 'Published');

    const normalizedSearch = search.trim().toLowerCase();
    const normalizedTag = tagFilter.trim().toLowerCase();

    if (normalizedSearch) {
      result = result.filter((post) => {
        const authorName = getDisplayName(post.author);

        return [
          post.title,
          post.content,
          post.tags,
          authorName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      });
    }

    if (normalizedTag) {
      result = result.filter((post) =>
        String(post.tags || '')
          .toLowerCase()
          .includes(normalizedTag)
      );
    }

    return result;
  }, [posts, myPosts, activeTab, search, tagFilter]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setEditingPostId('');
  };

  const startEditing = (post) => {
    setEditingPostId(post._id);
    setTitle(post.title || '');
    setContent(post.content || '');
    setTags(post.tags || '');
    setNotice('');
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePost = async (isFinal) => {
    if (!currentUserId) {
      setError(
        'Your user ID is missing. Please sign in again and try once more.'
      );
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Please enter both a post title and its content.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const isEditing = Boolean(editingPostId);

      const url = isEditing
        ? `${API}/update/${editingPostId}`
        : `${API}/create`;

      const method = isEditing ? 'PUT' : 'POST';

      const body = isEditing
        ? {
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim(),
            isFinal
          }
        : {
            author: currentUserId,
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim(),
            isFinal
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not save your post.')
        );
      }

      setNotice(
        data.message ||
          (isFinal
            ? 'Your post has been published!'
            : 'Your draft has been saved!')
      );

      resetForm();
      setActiveTab(isFinal ? 'feed' : 'mine');

      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not save your post.');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (post) => {
    if (!post?._id) return;

    const confirmed = window.confirm(
      `Delete "${post.title}" permanently?`
    );

    if (!confirmed) return;

    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/delete/${post._id}`,
        { method: 'DELETE' }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not delete this post.')
        );
      }

      if (editingPostId === post._id) {
        resetForm();
      }

      setNotice(data.message || 'Post deleted successfully.');
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not delete this post.');
    }
  };

  const publishDraft = async (post) => {
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/update/${post._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isFinal: true })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not publish the draft.')
        );
      }

      setNotice(data.message || 'Draft published successfully.');
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not publish this draft.');
    }
  };

  const addComment = async (post) => {
    const text = (commentInputs[post._id] || '').trim();

    if (!currentUserId) {
      setError('Please sign in again before commenting.');
      return;
    }

    if (!text) {
      setError('Please write a comment first.');
      return;
    }

    setCommentingPostId(post._id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/comment/${post._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user: currentUserId,
            text
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not add your comment.')
        );
      }

      setCommentInputs((current) => ({
        ...current,
        [post._id]: ''
      }));

      setNotice(data.message || 'Comment added successfully.');

      setExpandedComments((current) => ({
        ...current,
        [post._id]: true
      }));

      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not add your comment.');
    } finally {
      setCommentingPostId('');
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((current) => ({
      ...current,
      [postId]: !current[postId]
    }));
  };

  const isPostOwner = (post) => {
    const authorId =
      typeof post.author === 'object'
        ? post.author?._id
        : post.author;

    return (
      Boolean(currentUserId) &&
      String(authorId || '') === String(currentUserId)
    );
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f4f8f2',
      color: '#203326',
      fontFamily: "'Segoe UI', sans-serif"
    },
    container: {
      maxWidth: 1150,
      margin: '0 auto',
      padding: '30px 18px'
    },
    panel: {
      background: '#fff',
      border: '1px solid #e0e9dd',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 4px 16px rgba(30, 70, 35, 0.05)'
    },
    input: {
      width: '100%',
      padding: '11px 12px',
      border: '1px solid #d5dfd2',
      borderRadius: 9,
      background: '#fff',
      color: '#203326'
    },
    greenButton: {
      background: '#287b3c',
      border: '1px solid #287b3c',
      color: '#fff',
      borderRadius: 9,
      padding: '10px 16px'
    },
    mutedButton: {
      background: '#fff',
      border: '1px solid #d5dfd2',
      color: '#304a35',
      borderRadius: 9,
      padding: '9px 13px'
    }
  };

  return (
    <div style={styles.page}>
      <FarmerNavbar />

      <main style={styles.container}>
        <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <div
              className="fw-semibold small mb-2"
              style={{ color: '#287b3c', letterSpacing: 1 }}
            >
              AGRI COMMUNITY
            </div>

            <h1 className="fw-bold mb-2">🌱 Community</h1>

            <p className="text-secondary mb-0">
              Share farming experiences, learn from others, and discuss ideas.
            </p>
          </div>

          <button
            type="button"
            style={styles.greenButton}
            onClick={loadPosts}
            disabled={loading}
          >
            ↻ Refresh feed
          </button>
        </header>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Dismiss error"
              onClick={() => setError('')}
            />
          </div>
        )}

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Dismiss message"
              onClick={() => setNotice('')}
            />
          </div>
        )}

        {/* Create / edit post */}
        <section style={styles.panel} className="mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                {editingPostId ? '✏️ Edit Your Post' : '📝 Create a Post'}
              </h4>
              <p className="text-secondary small mb-0">
                Posting as {currentUserName} · {currentRole}
              </p>
            </div>

            {editingPostId && (
              <button
                type="button"
                style={styles.mutedButton}
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              savePost(true);
            }}
          >
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="post-title">
                Post title
              </label>

              <input
                id="post-title"
                style={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: How I improved my soil quality"
                maxLength={160}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="post-content">
                Your message
              </label>

              <textarea
                id="post-content"
                style={{ ...styles.input, minHeight: 140, resize: 'vertical' }}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share your question, experience, or farming tip..."
                rows={5}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="post-tags">
                Tags (optional)
              </label>

              <input
                id="post-tags"
                style={styles.input}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Wheat, irrigation, soil health"
              />

              <div className="form-text">
                Separate tags with commas to help people find your post.
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                style={styles.mutedButton}
                disabled={submitting}
                onClick={() => savePost(false)}
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="submit"
                style={styles.greenButton}
                disabled={submitting}
              >
                {submitting
                  ? 'Please wait...'
                  : editingPostId
                    ? 'Save & Publish'
                    : '🚀 Publish Post'}
              </button>
            </div>
          </form>
        </section>

        {/* Feed navigation */}
        <section style={styles.panel} className="mb-4">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              style={
                activeTab === 'feed'
                  ? styles.greenButton
                  : styles.mutedButton
              }
              onClick={() => setActiveTab('feed')}
            >
              🌍 Community Feed
            </button>

            <button
              type="button"
              style={
                activeTab === 'mine'
                  ? styles.greenButton
                  : styles.mutedButton
              }
              onClick={() => setActiveTab('mine')}
            >
              👤 My Posts ({myPosts.length})
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-8">
              <input
                style={styles.input}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search titles, posts, authors..."
                aria-label="Search community posts"
              />
            </div>

            <div className="col-md-4">
              <input
                style={styles.input}
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                placeholder="Filter by tag"
                aria-label="Filter posts by tag"
              />
            </div>
          </div>
        </section>

        {/* Post feed */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <h4 className="fw-bold mb-0">
            {activeTab === 'feed' ? 'Latest Discussions' : 'Your Posts'}
          </h4>

          <span className="badge rounded-pill text-bg-success">
            {visiblePosts.length} posts
          </span>
        </div>

        {loading ? (
          <div style={styles.panel} className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading</span>
            </div>
            <p className="text-secondary mt-3 mb-0">
              Loading community posts...
            </p>
          </div>
        ) : error && posts.length === 0 ? (
          <div style={styles.panel} className="text-center py-4">
            <h5>Community feed could not be loaded</h5>
            <p className="text-secondary">
              Check that the backend server is running and the API route is correct.
            </p>
            <button style={styles.greenButton} onClick={loadPosts}>
              Try again
            </button>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div style={styles.panel} className="text-center py-5">
            <div style={{ fontSize: 44 }}>🌿</div>
            <h5 className="fw-bold mt-2">Nothing to show yet</h5>
            <p className="text-secondary">
              {activeTab === 'mine'
                ? 'Your drafts and published posts will appear here.'
                : 'Be the first to start a farming discussion.'}
            </p>
            {(search || tagFilter) && (
              <button
                type="button"
                style={styles.mutedButton}
                onClick={() => {
                  setSearch('');
                  setTagFilter('');
                }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {visiblePosts.map((post) => {
              const comments = Array.isArray(post.comments)
                ? post.comments
                : [];

              const owner = isPostOwner(post);
              const isExpanded = Boolean(expandedComments[post._id]);

              const postTags = String(post.tags || '')
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

              return (
                <article style={styles.panel} key={post._id}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                        style={{
                          width: 46,
                          height: 46,
                          minWidth: 46,
                          background: '#e5f2e4',
                          color: '#287b3c',
                          fontSize: 18
                        }}
                      >
                        {getDisplayName(post.author).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="fw-semibold">
                          {getDisplayName(post.author)}
                        </div>
                        <div className="text-secondary small">
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      {post.status === 'Draft' && (
                        <span className="badge text-bg-warning">Draft</span>
                      )}

                      {owner && (
                        <span className="badge text-bg-success">Your post</span>
                      )}
                    </div>
                  </div>

                  <h5 className="fw-bold mt-4 mb-2">{post.title}</h5>

                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.7
                    }}
                  >
                    {post.content}
                  </p>

                  {postTags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {postTags.map((tag, index) => (
                        <span
                          className="badge rounded-pill"
                          style={{
                            background: '#edf5ec',
                            color: '#287b3c',
                            padding: '7px 10px'
                          }}
                          key={`${tag}-${index}`}
                        >
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 align-items-center border-top pt-3">
                    <button
                      type="button"
                      style={styles.mutedButton}
                      onClick={() => toggleComments(post._id)}
                    >
                      💬 {comments.length} Comments
                      {isExpanded ? ' ▲' : ' ▼'}
                    </button>

                    {owner && (
                      <>
                        <button
                          type="button"
                          style={styles.mutedButton}
                          onClick={() => startEditing(post)}
                        >
                          ✏️ Edit
                        </button>

                        {post.status === 'Draft' && (
                          <button
                            type="button"
                            style={styles.greenButton}
                            onClick={() => publishDraft(post)}
                          >
                            Publish Draft
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => deletePost(post)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <section
                      className="mt-3 pt-3"
                      style={{ borderTop: '1px solid #e5ece2' }}
                    >
                      <h6 className="fw-bold mb-3">Discussion</h6>

                      {comments.length === 0 ? (
                        <p className="text-secondary small">
                          No comments yet. Start the discussion!
                        </p>
                      ) : (
                        <div className="d-flex flex-column gap-3 mb-3">
                          {comments.map((comment, index) => (
                            <div
                              key={comment._id || `${post._id}-${index}`}
                              className="rounded-3 p-3"
                              style={{ background: '#f5f8f3' }}
                            >
                              <div className="fw-semibold small mb-1">
                                {getDisplayName(comment.user)}
                              </div>

                              <p
                                className="mb-1"
                                style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                              >
                                {comment.text}
                              </p>

                              <div className="text-secondary" style={{ fontSize: 12 }}>
                                {formatDate(comment.createdAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {post.status === 'Published' ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            addComment(post);
                          }}
                        >
                          <label
                            className="form-label fw-semibold"
                            htmlFor={`comment-${post._id}`}
                          >
                            Add a comment
                          </label>

                          <textarea
                            id={`comment-${post._id}`}
                            style={{ ...styles.input, minHeight: 75 }}
                            rows={2}
                            value={commentInputs[post._id] || ''}
                            onChange={(event) =>
                              setCommentInputs((current) => ({
                                ...current,
                                [post._id]: event.target.value
                              }))
                            }
                            placeholder="Share a helpful reply..."
                            required
                          />

                          <button
                            type="submit"
                            className="btn btn-success mt-2"
                            disabled={commentingPostId === post._id}
                          >
                            {commentingPostId === post._id
                              ? 'Sending...'
                              : 'Post Comment'}
                          </button>
                        </form>
                      ) : (
                        <p className="text-secondary small mb-0">
                          Publish this post before starting a discussion.
                        </p>
                      )}
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <p className="text-secondary small mt-4">
          Be respectful, share reliable farming information, and protect
          personal information when posting.
        </p>
      </main>
    </div>
  );
}

export default Community;
