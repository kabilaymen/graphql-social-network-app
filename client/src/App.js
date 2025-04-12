import React, { useState, useEffect } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  useLazyQuery,
  useMutation,
  useSubscription,
  split,
  HttpLink
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { gql } from 'graphql-tag';
import './App.css';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  keepAlive: 5000,
  connectionParams: {
    reconnect: true,
    connectionCallback: (err) => {
      if (err) console.error("WebSocket connection error:", err);
    }
  },
  on: {
    connected: () => console.log("WebSocket connected"),
    closed: () => console.log("WebSocket closed"),
    error: (err) => console.error("WebSocket error:", err)
  }
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);


const client = new ApolloClient({
  link: splitLink,
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

const LIKE_POST = gql`
  mutation LikePost($id: ID!, $userId: ID!) {
    likePost(id: $id, userId: $userId) {
      id
      likes
    }
  }
`;

const POST_CREATED_SUBSCRIPTION = gql`
  subscription OnPostCreated {
    postCreated {
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
  }
`;

const COMMENT_CREATED_SUBSCRIPTION = gql`
  subscription OnCommentCreated($postId: ID) {
    commentCreated(postId: $postId) {
      id
      message
      publishDate
      owner {
        id
        firstName
        lastName
      }
      post {
        id
      }
    }
  }
`;

const POST_LIKED_SUBSCRIPTION = gql`
  subscription OnPostLiked {
    postLiked {
      id
      likes
    }
  }
`;

function PostCard({ post, currentUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [fetchComments, { data: commentData, loading: commentsLoading }] = useLazyQuery(GET_COMMENTS, {
    variables: { postId: post.id },
  });

  const [likedByCurrentUser, setLikedByCurrentUser] = useState(false);
  const [likePost] = useMutation(LIKE_POST);

  const { data: newCommentData } = useSubscription(COMMENT_CREATED_SUBSCRIPTION, {
    variables: { postId: post.id },
    skip: !showComments
  });

  useEffect(() => {
    if (newCommentData?.commentCreated && showComments) {
      fetchComments();
    }
  }, [newCommentData, fetchComments, showComments]);

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

  const handleLikePost = () => {
    likePost({ variables: { id: post.id, userId: currentUserId } })
      .then(() => {
        setLikedByCurrentUser(!likedByCurrentUser);
      });
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
          <button onClick={handleLikePost} className="like-button">
            <span role="img" aria-label="heart">❤️</span>
          </button>
          {post.likes} likes
        </div>
        <div className="tags">
          {post.tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="tag">#{tag}</span>
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
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(5);

  const [showNewPostNotification, setShowNewPostNotification] = useState({
    visible: false,
    author: ''
  });

  const { data, refetch } = useQuery(GET_POSTS, {
    variables: { page, limit: 5 }
  });

  useEffect(() => {
    if (data) {
      setPosts(data.posts.data);
      setTotalPosts(data.posts.total);
      setCurrentLimit(data.posts.limit);
    }
  }, [data]);

  const { data: subData } = useSubscription(POST_CREATED_SUBSCRIPTION);
  useEffect(() => {
    if (subData?.postCreated) {
      setPosts(prevPosts => [subData.postCreated, ...prevPosts]);
      setTotalPosts(prev => prev + 1);
      setShowNewPostNotification({
        visible: true,
        author: `${subData.postCreated.owner.firstName} ${subData.postCreated.owner.lastName}`
      });
      setTimeout(() => {
        setShowNewPostNotification(prev => ({ ...prev, visible: false }));
      }, 3000);
    }
  }, [subData]);

  const totalPages = Math.ceil(totalPosts / currentLimit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      refetch({ page: newPage, limit: 5 });
    }
  };

  return (
    <div className="post-list">
      {showNewPostNotification.visible && (
        <div className="new-post-notification">
          New post by {showNewPostNotification.author}!
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Recent Posts</h2>
        <button onClick={() => refetch()}>Refresh</button>
      </div>

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={posts[0]?.owner?.id}
        />
      ))}

      <div className="pagination">
        <p>Showing {posts.length} of {totalPosts} posts</p>
        <p>Page {page} of {totalPages}</p>
        <div className="pagination-controls">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>&lt;</button>
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
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>&gt;</button>
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
