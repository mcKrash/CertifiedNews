const articles = [
  {
    id: 101,
    title: "Cross-border climate monitoring network expands verified wildfire alerts across three regions",
    body: "A coordinated public alert network now links emergency agencies, satellite feeds, and accredited newsrooms to reduce misinformation during wildfire events.",
    categoryId: 4,
    sourceUrl: "https://www.reuters.com",
    sourceName: "Reuters Climate Desk",
    authorId: 1,
    status: "verified",
    publishedAt: "2026-04-16T08:30:00.000Z",
    imageUrl: null,
    viewCount: 1624,
  },
  {
    id: 102,
    title: "City budget negotiations move into late-stage talks as service guarantees remain under review",
    body: "Negotiators say transportation and housing protections are likely to remain, but final line items still require confirmation from primary budget documents.",
    categoryId: 2,
    sourceUrl: "https://apnews.com",
    sourceName: "Associated Press Metro",
    authorId: 1,
    status: "under review",
    publishedAt: "2026-04-16T14:15:00.000Z",
    imageUrl: null,
    viewCount: 947,
  },
  {
    id: 103,
    title: "New study reveals unexpected biodiversity in urban micro-habitats",
    body: "Researchers found that even small rooftop gardens can support a wide variety of insect species, highlighting the importance of urban greening.",
    categoryId: 4,
    sourceUrl: "https://www.nature.com",
    sourceName: "Nature Environment",
    authorId: 1,
    status: "verified",
    publishedAt: "2026-04-15T10:00:00.000Z",
    imageUrl: null,
    viewCount: 512,
  }
];

const users = [
  {
    id: 1,
    email: "admin@certifiednews.local",
    username: "admin",
    password_hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm", // password: 'admin'
    role: "admin",
    trustScore: 1000,
    avatarUrl: null,
    isBanned: false,
    bio: "Senior Editor and Fact-Checker at Certified News. Dedicated to ensuring accuracy and integrity in journalism.",
    interests: ["Investigative Journalism", "Climate Change", "Technology", "Politics"],
    joinedAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: 2,
    email: "maya@certifiednews.local",
    username: "maya_reports",
    role: "verified_reporter",
    trustScore: 782,
    avatarUrl: null,
    isBanned: false,
    bio: "Independent reporter covering environmental and social issues. Passionate about verified storytelling.",
    interests: ["Environment", "Social Justice", "Science", "Community News"],
    joinedAt: "2025-03-20T14:30:00.000Z",
  },
  {
    id: 3,
    email: "omar@certifiednews.local",
    username: "citywatch_omer",
    role: "member",
    trustScore: 468,
    avatarUrl: null,
    isBanned: false,
    bio: "Local community contributor. I love sharing verified updates about our neighborhood.",
    interests: ["Local News", "Urban Development", "Transportation", "Community Events"],
    joinedAt: "2025-06-10T09:15:00.000Z",
  }
];

const categories = [
  { id: 1, name: "World", slug: "world", iconUrl: null, parentId: null },
  { id: 2, name: "Politics", slug: "politics", iconUrl: null, parentId: null },
  { id: 3, name: "Tech", slug: "tech", iconUrl: null, parentId: null },
  { id: 4, name: "Science", slug: "science", iconUrl: null, parentId: null },
  { id: 5, name: "Health", slug: "health", iconUrl: null, parentId: null },
];

const communityPosts = [
  {
    id: 201,
    userId: 2,
    title: "Residents document water distribution schedule after overnight infrastructure repair",
    content: "Local residents compiled a verified neighborhood schedule after the utility provider published an overnight infrastructure repair notice.",
    sourceUrl: "https://example.gov/water-repair",
    sourceDomain: "example.gov",
    status: "verified",
    upvotes: 41,
    downvotes: 2,
    flagsCount: 0,
    createdAt: "2026-04-16T07:10:00.000Z",
  },
  {
    id: 202,
    userId: 3,
    title: "Witnesses share transport delays near civic square, but route suspension notice still pending",
    content: "Several members reported bus delays around the civic square, but the transport authority has not yet published a formal suspension notice.",
    sourceUrl: "https://metro.example.org/service-updates",
    sourceDomain: "metro.example.org",
    status: "under review",
    upvotes: 17,
    downvotes: 3,
    flagsCount: 2,
    createdAt: "2026-04-16T09:25:00.000Z",
  },
  {
    id: 203,
    userId: 3,
    title: "Unconfirmed claim about school closure rejected after district office denies notice",
    content: "A community submission claimed a district-wide closure, but moderators found no matching school office notice and rejected the post.",
    sourceUrl: "https://schools.example.edu/notices",
    sourceDomain: "schools.example.edu",
    status: "rejected",
    upvotes: 4,
    downvotes: 12,
    flagsCount: 6,
    createdAt: "2026-04-15T18:00:00.000Z",
  }
];

const comments = [
  {
    id: 301,
    postId: 201,
    userId: 3,
    parentCommentId: null,
    content: "The provider map matched what residents saw on the ground.",
    createdAt: "2026-04-16T07:40:00.000Z",
    isDeleted: false,
  }
];

const verificationLog = [
  {
    id: 401,
    articleId: 101,
    postId: null,
    userId: 1,
    contentId: 101,
    contentType: "article",
    checkedBy: "system",
    result: "verified",
    notes: "Whitelisted source and moderator approval.",
    createdAt: "2026-04-16T08:42:00.000Z",
  },
  {
    id: 402,
    articleId: 102,
    postId: null,
    userId: 1,
    contentId: 102,
    contentType: "article",
    checkedBy: "moderator",
    result: "under review",
    notes: "Waiting for signed budget schedule.",
    createdAt: "2026-04-16T14:29:00.000Z",
  },
  {
    id: 403,
    articleId: null,
    postId: 201,
    userId: 1,
    contentId: 201,
    contentType: "post",
    checkedBy: "system",
    result: "verified",
    notes: "Trusted utility notice with strong community support.",
    createdAt: "2026-04-16T07:25:00.000Z",
  },
  {
    id: 404,
    articleId: null,
    postId: 203,
    userId: 1,
    contentId: 203,
    contentType: "post",
    checkedBy: "moderator",
    result: "rejected",
    notes: "District office denied closure notice.",
    createdAt: "2026-04-15T18:20:00.000Z",
  }
];

function hydrateArticle(article) {
  return {
    ...article,
    author: users.find(u => u.id === article.authorId),
    category: categories.find(c => c.id === article.categoryId),
    verificationLogs: verificationLog.filter(l => l.articleId === article.id),
  };
}

function hydratePost(post) {
  return {
    ...post,
    user: users.find(u => u.id === post.userId),
    comments: comments.filter(c => c.postId === post.id),
    verificationLogs: verificationLog.filter(l => l.postId === post.id),
  };
}

module.exports = {
  articles,
  users,
  categories,
  communityPosts,
  comments,
  verificationLog,
  hydrateArticle,
  hydratePost,
};
