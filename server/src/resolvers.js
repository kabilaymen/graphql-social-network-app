import { db } from './dataGenerator.js';
import { v4 as uuidv4 } from 'uuid';
import { pubsub } from './pubsub.js';

export const EVENTS = {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    POST_CREATED: 'POST_CREATED',
    POST_UPDATED: 'POST_UPDATED',
    POST_DELETED: 'POST_DELETED',
    POST_LIKED: 'POST_LIKED',
    COMMENT_CREATED: 'COMMENT_CREATED',
    COMMENT_DELETED: 'COMMENT_DELETED'
};

export const resolvers = {
    Query: {
        users: (_, { page = 1, limit = 10, sortBy = "registerDate" }) => {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let sortedUsers = [...db.users];
            sortedUsers.sort((a, b) => {
                if (a[sortBy] < b[sortBy]) return -1;
                if (a[sortBy] > b[sortBy]) return 1;
                return 0;
            });

            const data = sortedUsers.slice(startIndex, endIndex);

            return {
                data,
                total: db.users.length,
                page,
                limit
            };
        },

        user: (_, { id }) => {
            return db.users.find(user => user.id === id);
        },

        posts: (_, { page = 1, limit = 10, sortBy = "publishDate" }) => {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let sortedPosts = [...db.posts];
            sortedPosts.sort((a, b) => {
                if (a[sortBy] < b[sortBy]) return -1;
                if (a[sortBy] > b[sortBy]) return 1;
                return 0;
            });

            const data = sortedPosts.slice(startIndex, endIndex);

            return {
                data,
                total: db.posts.length,
                page,
                limit
            };
        },

        postsByUser: (_, { userId, page = 1, limit = 10 }) => {
            const userPosts = db.posts.filter(post => post.owner === userId);
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            userPosts.sort((a, b) => {
                if (a.publishDate < b.publishDate) return -1;
                if (a.publishDate > b.publishDate) return 1;
                return 0;
            });

            const data = userPosts.slice(startIndex, endIndex);

            return {
                data,
                total: userPosts.length,
                page,
                limit
            };
        },

        postsByTag: (_, { tag, page = 1, limit = 10 }) => {
            const tagPosts = db.posts.filter(post => post.tags.includes(tag));
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            tagPosts.sort((a, b) => {
                if (a.publishDate < b.publishDate) return -1;
                if (a.publishDate > b.publishDate) return 1;
                return 0;
            });

            const data = tagPosts.slice(startIndex, endIndex);

            return {
                data,
                total: tagPosts.length,
                page,
                limit
            };
        },

        post: (_, { id }) => {
            return db.posts.find(post => post.id === id);
        },

        comments: (_, { page = 1, limit = 10 }) => {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let sortedComments = [...db.comments];
            sortedComments.sort((a, b) => {
                if (a.publishDate < b.publishDate) return -1;
                if (a.publishDate > b.publishDate) return 1;
                return 0;
            });

            const data = sortedComments.slice(startIndex, endIndex);

            return {
                data,
                total: db.comments.length,
                page,
                limit
            };
        },

        commentsByPost: (_, { postId, page = 1, limit = 10 }) => {
            const postComments = db.comments.filter(comment => comment.post === postId);
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            postComments.sort((a, b) => {
                if (a.publishDate < b.publishDate) return -1;
                if (a.publishDate > b.publishDate) return 1;
                return 0;
            });

            const data = postComments.slice(startIndex, endIndex);

            return {
                data,
                total: postComments.length,
                page,
                limit
            };
        },

        commentsByUser: (_, { userId, page = 1, limit = 10 }) => {
            const userComments = db.comments.filter(comment => comment.owner === userId);
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            userComments.sort((a, b) => {
                if (a.publishDate < b.publishDate) return -1;
                if (a.publishDate > b.publishDate) return 1;
                return 0;
            });

            const data = userComments.slice(startIndex, endIndex);

            return {
                data,
                total: userComments.length,
                page,
                limit
            };
        },

        tags: () => {
            return Array.from(db.tags);
        }
    },

    Mutation: {
        createUser: (_, { input }) => {
            const newUser = {
                id: uuidv4(),
                ...input,
                registerDate: new Date().toISOString()
            };

            db.users.push(newUser);

            pubsub.publish(EVENTS.USER_CREATED, { userCreated: newUser });

            return newUser;
        },

        updateUser: (_, { id, input }) => {
            const userIndex = db.users.findIndex(user => user.id === id);
            if (userIndex === -1) {
                throw new Error("User not found");
            }

            if (input.email) {
                delete input.email;
            }

            db.users[userIndex] = {
                ...db.users[userIndex],
                ...input
            };

            pubsub.publish(EVENTS.USER_UPDATED, { userUpdated: db.users[userIndex] });

            return db.users[userIndex];
        },

        deleteUser: (_, { id }) => {
            const userIndex = db.users.findIndex(user => user.id === id);
            if (userIndex === -1) {
                throw new Error("User not found");
            }

            db.users.splice(userIndex, 1);

            db.posts = db.posts.filter(post => post.owner !== id);
            db.comments = db.comments.filter(comment => comment.owner !== id);

            pubsub.publish(EVENTS.USER_DELETED, { userDeleted: id });

            return id;
        },

        createPost: (_, { input }) => {
            const newPost = {
                id: uuidv4(),
                ...input,
                likes: 0,
                publishDate: new Date().toISOString()
            };

            db.posts.push(newPost);

            if (newPost.tags) {
                newPost.tags.forEach(tag => db.tags.add(tag));
            }

            pubsub.publish(EVENTS.POST_CREATED, {
                postCreated: {
                    ...newPost,
                    owner: db.users.find(user => user.id === newPost.owner)
                }
            });

            return newPost;
        },

        updatePost: (_, { id, input }) => {
            const postIndex = db.posts.findIndex(post => post.id === id);
            if (postIndex === -1) {
                throw new Error("Post not found");
            }

            if (input.owner) {
                delete input.owner;
            }

            db.posts[postIndex] = {
                ...db.posts[postIndex],
                ...input
            };

            if (input.tags) {
                input.tags.forEach(tag => db.tags.add(tag));
            }

            pubsub.publish(EVENTS.POST_UPDATED, { postUpdated: db.posts[postIndex] });

            return db.posts[postIndex];
        },

        deletePost: (_, { id }) => {
            const postIndex = db.posts.findIndex(post => post.id === id);
            if (postIndex === -1) {
                throw new Error("Post not found");
            }

            db.posts.splice(postIndex, 1);

            db.comments = db.comments.filter(comment => comment.post !== id);

            pubsub.publish(EVENTS.POST_DELETED, { postDeleted: id });

            return id;
        },

        likePost: (_, { id, userId }) => {
            const postIndex = db.posts.findIndex(post => post.id === id);
            if (postIndex === -1) {
                throw new Error("Post not found");
            }

            const existingLikeIndex = db.likes.findIndex(
                like => like.userId === userId && like.postId === id
            );

            if (existingLikeIndex === -1) {
                db.likes.push({ userId, postId: id });
                db.posts[postIndex].likes += 1;
            } else {
                db.likes.splice(existingLikeIndex, 1);
                db.posts[postIndex].likes -= 1;
            }

            pubsub.publish(EVENTS.POST_LIKED, { postLiked: db.posts[postIndex] });

            return db.posts[postIndex];
        },

        createComment: (_, { input }) => {
            const newComment = {
                id: uuidv4(),
                ...input,
                publishDate: new Date().toISOString()
            };

            db.comments.push(newComment);

            pubsub.publish(EVENTS.COMMENT_CREATED, {
                commentCreated: newComment,
                postId: input.post
            });

            return newComment;
        },

        deleteComment: (_, { id }) => {
            const commentIndex = db.comments.findIndex(comment => comment.id === id);
            if (commentIndex === -1) {
                throw new Error("Comment not found");
            }

            const deletedComment = db.comments[commentIndex];
            db.comments.splice(commentIndex, 1);

            pubsub.publish(EVENTS.COMMENT_DELETED, { commentDeleted: id });

            return id;
        }
    },

    Subscription: {
        userCreated: {
            subscribe: () => pubsub.asyncIterator([EVENTS.USER_CREATED])
        },
        userUpdated: {
            subscribe: () => pubsub.asyncIterator([EVENTS.USER_UPDATED])
        },
        userDeleted: {
            subscribe: () => pubsub.asyncIterator([EVENTS.USER_DELETED])
        },
        postCreated: {
            subscribe: () => pubsub.asyncIterator([EVENTS.POST_CREATED])
        },
        postUpdated: {
            subscribe: () => pubsub.asyncIterator([EVENTS.POST_UPDATED])
        },
        postDeleted: {
            subscribe: () => pubsub.asyncIterator([EVENTS.POST_DELETED])
        },
        postLiked: {
            subscribe: () => pubsub.asyncIterator([EVENTS.POST_LIKED])
        },
        commentCreated: {
            subscribe: (_, { postId }) => {
                if (postId) {
                    return {
                        [Symbol.asyncIterator]: () => {
                            const asyncIterator = pubsub.asyncIterator([EVENTS.COMMENT_CREATED]);

                            const filterFn = payload => {
                                return payload.commentCreated.post === postId;
                            };

                            const filter = {
                                next: async () => {
                                    while (true) {
                                        const { value, done } = await asyncIterator.next();

                                        if (done) return { value, done };

                                        if (filterFn(value)) {
                                            return { value, done };
                                        }
                                    }
                                },
                                return: () => asyncIterator.return(),
                                throw: err => asyncIterator.throw(err)
                            };

                            return filter;
                        }
                    };
                }

                return pubsub.asyncIterator([EVENTS.COMMENT_CREATED]);
            }
        },
        commentDeleted: {
            subscribe: () => pubsub.asyncIterator([EVENTS.COMMENT_DELETED])
        }
    },

    User: {
        posts: (user) => {
            return db.posts.filter(post => post.owner === user.id);
        },
        comments: (user) => {
            return db.comments.filter(comment => comment.owner === user.id);
        }
    },

    Post: {
        owner: (post) => {
            return db.users.find(user => user.id === post.owner);
        },
        comments: (post) => {
            return db.comments.filter(comment => comment.post === post.id);
        },
        hasLiked: (post, { userId }) => {
            return db.likes.some(like => like.postId === post.id && like.userId === userId);
        }
    },

    Comment: {
        owner: (comment) => {
            return db.users.find(user => user.id === comment.owner);
        },
        post: (comment) => {
            return db.posts.find(post => post.id === comment.post);
        }
    }
};