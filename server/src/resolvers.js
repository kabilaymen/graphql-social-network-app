const { db } = require('./dataGenerator');
const { v4: uuidv4 } = require('uuid');

const resolvers = {
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

            return db.posts[postIndex];
        },

        deletePost: (_, { id }) => {
            const postIndex = db.posts.findIndex(post => post.id === id);
            if (postIndex === -1) {
                throw new Error("Post not found");
            }

            db.posts.splice(postIndex, 1);

            db.comments = db.comments.filter(comment => comment.post !== id);

            return id;
        },

        createComment: (_, { input }) => {
            const newComment = {
                id: uuidv4(),
                ...input,
                publishDate: new Date().toISOString()
            };

            db.comments.push(newComment);
            return newComment;
        },

        deleteComment: (_, { id }) => {
            const commentIndex = db.comments.findIndex(comment => comment.id === id);
            if (commentIndex === -1) {
                throw new Error("Comment not found");
            }

            db.comments.splice(commentIndex, 1);
            return id;
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

module.exports = resolvers;