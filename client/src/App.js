import React, { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { gql } from 'graphql-tag';
import './App.css';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache()
});

const GET_POSTS = gql`
  query GetPosts($page: Int, $limit: Int) {
    posts(page: $page, limit: $limit) {
      data {
        id
        text
        image
        likes
        tags
        publishDate
        owner {
          id
          firstName
          lastName
          picture
        }
        comments {
          id
        }
      }
      total
      page
      limit
    }
  }
`;

const GET_COMMENTS = gql`
  query GetComments($postId: ID!) {
    commentsByPost(postId: $postId) {
      data {
        id
        message
        publishDate
      }
      total
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      id
      text
      publishDate
    }
  }
`;

function PostCard({ post }) {
  const [showComments, setShowComments] = useState(false);
  const [fetchComments, { data: commentData, loading: commentsLoading }] = useLazyQuery(GET_COMMENTS, {
    variables: { postId: post.id },
  });

  const formattedDate = new Date(post.publishDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleShowComments = () => {
    if (!showComments && post.comments.length > 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img
          src={post.owner.picture}
          alt={`${post.owner.firstName} ${post.owner.lastName}`}
          className="avatar"
        />
        <div>
          <h3>{post.owner.firstName} {post.owner.lastName}</h3>
          <span className="date">{formattedDate}</span>
        </div>
      </div>

      <p className="post-text">{post.text}</p>

      {post.image && (
        <img src={post.image} alt="Post content" className="post-image" />
      )}

      <div className="post-footer">
        <div className="likes">
          <span role="img" aria-label="heart">❤️</span> {post.likes} likes
        </div>
        <div className="tags">
          {post.tags.map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
        <div className="comments-count">
          {post.comments.length > 0 && (
            <button onClick={handleShowComments}>
              <span role="img" aria-label="comment">💬</span> {post.comments.length} comments
            </button>
          )}
        </div>
      </div>

      {showComments && post.comments.length > 0 && (
        <div className="comments-section">
          {commentsLoading ? (
            <div>Loading comments...</div>
          ) : (
            commentData?.commentsByPost?.data?.map(comment => (
              <div key={comment.id} className="comment">
                <p>{comment.message}</p>
                <small>{new Date(comment.publishDate).toLocaleDateString()}</small>
              </div>
            )) ?? <div>No comments found</div>
          )}
        </div>
      )}
    </div>
  );
}

function PostList() {
  const [page, setPage] = useState(1);
  const { loading, error, data, refetch } = useQuery(GET_POSTS, {
    variables: { page, limit: 5 }
  });

  if (loading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="loading">Error: {error.message}</div>;

  const totalPages = Math.ceil(data.posts.total / data.posts.limit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      refetch({ page: newPage, limit: 5 });
    }
  };

  return (
    <div className="post-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Recent Posts</h2>
        <button onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      {data.posts.data.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      <div className="pagination">
        <p>Showing {data.posts.data.length} of {data.posts.total} posts</p>
        <p>Page {data.posts.page} of {totalPages}</p>

        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            &lt;
          </button>

          {[...Array(Math.min(totalPages, 5)).keys()].map(index => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                style={{
                  backgroundColor: page === pageNum ? 'var(--primary-gold)' : 'var(--white)',
                  color: page === pageNum ? 'var(--white)' : 'var(--primary-gold)'
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePostForm({ ownerId }) {
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');

  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { page: 1, limit: 5 } }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    createPost({
      variables: {
        input: {
          text,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          owner: ownerId
        }
      }
    });

    setText('');
    setTags('');
  };

  return (
    <div className="create-post">
      <h2>Share your thoughts</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            placeholder="What's on your mind?"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. travel, fashion, inspiration"
          />
        </div>

        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Posting...' : 'Share Post'}
        </button>
      </form>
    </div>
  );
}

function AppContent() {
  const { loading, error, data } = useQuery(GET_POSTS, {
    variables: { page: 1, limit: 1 }
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="loading">Error: {error.message}</div>;

  const ownerId = data.posts.data[0]?.owner?.id;
  if (!ownerId) return <div className="loading">No posts available to extract owner ID.</div>;

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <a href="/" className="logo">
            <span className="logo-icon">✦</span>
            GoldSocial
          </a>
        </div>
      </header>

      <main>
        <div className="sidebar">
          <CreatePostForm ownerId={ownerId} />
        </div>

        <PostList />
      </main>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <AppContent />
    </ApolloProvider>
  );
}

export default App;