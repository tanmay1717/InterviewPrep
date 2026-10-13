/**
 * Shared study plan data for the Interview Prep Tracker extension.
 * Used by both popup.js (UI) and background.js (daily reminder text).
 * Loaded via <script> tag in popup.html and importScripts() in background.js.
 */

// Program start date (Monday). Adjust if you start on a different day.
const START_DATE = "2026-07-14";

// 9-week plan: Intermediate DSA level, prepping for interviews from mid-September onward.
const STUDY_PLAN = [
  {
    week: 1,
    theme: "Foundations Refresh",
    dsa: [
      "Arrays & Hashing (Two Sum, Group Anagrams, Top K Frequent)",
      "Two Pointers (Container With Most Water, 3Sum)",
      "Sliding Window (Longest Substring Without Repeating Chars)",
      "Stack basics (Valid Parentheses, Min Stack)"
    ],
    lld: [
      "Refresh OOP fundamentals: encapsulation, inheritance, polymorphism, abstraction",
      "Read through the SOLID principles with one example each"
    ],
    hld: [
      "Client-server model, DNS, HTTP/HTTPS basics",
      "Load balancing: what it is, common algorithms (round robin, least connections)"
    ]
  },
  {
    week: 2,
    theme: "Binary Search, Linked Lists & Creational Patterns",
    dsa: [
      "Binary Search (classic + search in rotated sorted array)",
      "Linked List (reverse list, cycle detection, merge two lists)",
      "Intro to Trees (traversals: inorder/preorder/postorder)"
    ],
    lld: [
      "Creational patterns: Singleton, Factory, Builder, Prototype",
      "Practice problem: Design a Parking Lot system"
    ],
    hld: [
      "Caching fundamentals: client-side, CDN, Redis/Memcached, cache invalidation strategies"
    ]
  },
  {
    week: 3,
    theme: "Trees, Tries & Structural Patterns",
    dsa: [
      "Trees: BST operations, validate BST, lowest common ancestor",
      "Tries (implement Trie, word search II)",
      "Heap / Priority Queue (kth largest, merge k sorted lists)"
    ],
    lld: [
      "Structural patterns: Adapter, Decorator, Composite, Facade",
      "Practice problem: Design a Vending Machine"
    ],
    hld: [
      "Databases: SQL vs NoSQL, when to use each",
      "Indexing basics and query performance"
    ]
  },
  {
    week: 4,
    theme: "Graphs & Behavioral Patterns",
    dsa: [
      "Backtracking (subsets, permutations, combination sum)",
      "Graphs: BFS/DFS, number of islands, clone graph",
      "Union-Find and topological sort (course schedule)"
    ],
    lld: [
      "Behavioral patterns: Observer, Strategy, State, Command",
      "Practice problem: Design Tic-Tac-Toe or a Chess move validator"
    ],
    hld: [
      "Database replication (leader-follower) and sharding basics",
      "Consistent hashing and the CAP theorem"
    ]
  },
  {
    week: 5,
    theme: "Shortest Paths & DP Part 1",
    dsa: [
      "Graphs: Dijkstra's algorithm, network delay time",
      "1-D Dynamic Programming (climbing stairs, house robber, coin change)"
    ],
    lld: [
      "Practice problem: Design Splitwise (expense-sharing app) - apply Strategy + Observer"
    ],
    hld: [
      "Message queues & pub-sub: Kafka, RabbitMQ, when to go async",
      "Idempotency and retries in distributed systems"
    ]
  },
  {
    week: 6,
    theme: "DP Part 2, Greedy & Microservices",
    dsa: [
      "2-D Dynamic Programming (unique paths, longest common subsequence)",
      "Greedy (jump game, gas station)",
      "Intervals (merge intervals, meeting rooms)"
    ],
    lld: [
      "Practice problem: Design a Library Management System or Movie Ticket Booking (BookMyShow)"
    ],
    hld: [
      "Microservices vs monolith trade-offs",
      "API gateways, rate limiting, consistency patterns (strong vs eventual)"
    ]
  },
  {
    week: 7,
    theme: "First HLD Practice Round",
    dsa: [
      "Math & Geometry basics + Bit Manipulation (single number, counting bits)",
      "Mixed review: redo 2 problems from your weakest topic so far, timed"
    ],
    lld: [
      "Practice problem: Design an Elevator System",
      "Practice problem: Design a Rate Limiter (LLD version)",
      "Timed mock LLD round (45 min, pick an unseen problem)"
    ],
    hld: [
      "Practice: Design a URL Shortener",
      "Practice: Design a Rate Limiter (HLD version)",
      "Practice: Design a Twitter/X-style feed"
    ]
  },
  {
    week: 8,
    theme: "Mock Interviews Week",
    dsa: [
      "2-3 timed mock coding interviews (45 min each, on Pramp/interviewing.io or with a friend)",
      "Revisit your single weakest DSA topic from the last 7 weeks"
    ],
    lld: [
      "Mock LLD interview #2 with a fresh problem",
      "Review and clean up your notes/diagrams from earlier problems"
    ],
    hld: [
      "Practice: Design WhatsApp/a chat system",
      "Practice: Design Uber/a ride-hailing system",
      "Practice: Design a Notification system",
      "One full mock HLD interview (45 min)"
    ]
  },
  {
    week: 9,
    theme: "Final Polish & Rest",
    dsa: [
      "Light, confidence-building review only - no new topics",
      "Skim your notes on patterns rather than grinding new problems"
    ],
    lld: [
      "Re-read your design pattern notes once",
      "Skim your solved LLD problems and their class diagrams"
    ],
    hld: [
      "Practice one more problem in your weakest HLD area, or Design YouTube/Netflix for extra practice",
      "One last mock HLD interview if you have the energy"
    ],
    behavioral: [
      "Prepare 5-6 STAR stories from your HP Inc. and project work (MediaForge, research work, Toastmasters portal, etc.)",
      "Research each company you've applied to using your Applications tracker before its interview"
    ]
  }
];

// Simple day-of-week rotation for the "today's focus" reminder.
// 0 = Sunday ... 6 = Saturday
const DAILY_FOCUS_ROTATION = {
  0: "rest", // Sunday - rest or light review
  1: "dsa",  // Monday
  2: "dsa",  // Tuesday
  3: "lld",  // Wednesday
  4: "dsa",  // Thursday
  5: "hld",  // Friday
  6: "mock"  // Saturday - mock interview / review day
};

const RESOURCES = {
  "Coding / DSA": [
    { name: "NeetCode Roadmap (structured order + video walkthroughs)", url: "https://neetcode.io/roadmap" },
    { name: "NeetCode 150 practice list (free solutions incl. premium problems)", url: "https://neetcode.io/practice" },
    { name: "LeetCode (practice problems)", url: "https://leetcode.com/" },
    { name: "Grind 75 (personalized schedule based on your timeline)", url: "https://www.grind75.com/" }
  ],
  "Company-wise LeetCode (free premium lists)": [
    { name: "snehasishroy - company-wise questions (freshest, updated 2026)", url: "https://github.com/snehasishroy/leetcode-companywise-interview-questions" },
    { name: "liquidslr - last 30 / 60 / 90 days + all-time per company", url: "https://github.com/liquidslr/leetcode-company-wise-problems" },
    { name: "krishnadey30 - sorted by frequency", url: "https://github.com/krishnadey30/LeetCode-Questions-CompanyWise" },
    { name: "AkashSingh3031 - complete premium problem list with solutions", url: "https://github.com/AkashSingh3031/Complete-LeetCode-Premium-Problems" },
    { name: "Tip: the LeetCode VS Code extension opens premium-tagged questions", url: "https://marketplace.visualstudio.com/items?itemName=LeetCode.vscode-leetcode" }
  ],
  "LLD / OOD": [
    { name: "Grokking the Object Oriented Design Interview (DesignGurus.io)", url: "https://www.designgurus.io/course/grokking-the-object-oriented-design-interview" },
    { name: "Refactoring.Guru - Design Patterns reference", url: "https://refactoring.guru/design-patterns" },
    { name: "System Design Primer - free OOD solutions", url: "https://github.com/donnemartin/system-design-primer/tree/master/solutions/object_oriented_design" }
  ],
  "HLD / System Design": [
    { name: "freeCodeCamp - System Design full course (video)", url: "https://youtu.be/C842vFY5kRo" },
    { name: "System Design Primer (free, GitHub)", url: "https://github.com/donnemartin/system-design-primer" },
    { name: "Grokking the System Design Interview (DesignGurus.io)", url: "https://www.designgurus.io/course/grokking-the-system-design-interview" },
    { name: "Free companion repo to Grokking System Design", url: "https://github.com/design-gurus/grokking-system-design" },
    { name: "ByteByteGo (Alex Xu - newsletter, diagrams, books)", url: "https://bytebytego.com/" }
  ],
  "Mock Interviews": [
    { name: "Pramp / Exponent Practice (free peer mock interviews)", url: "https://www.pramp.com/" },
    { name: "interviewing.io (paid mocks with experienced engineers)", url: "https://interviewing.io/" }
  ]
};

// Make available to both window (popup) and self (service worker) contexts.
if (typeof module !== "undefined") {
  module.exports = { START_DATE, STUDY_PLAN, DAILY_FOCUS_ROTATION, RESOURCES };
}
