/**
 * Practice content for the Practice tab.
 * CODING_PATTERNS: NeetCode-150-style pattern list. Each problem is [leetcode-slug, title, difficulty, premium?].
 * SYSTEM_DESIGN: an 11-week beginner roadmap plus classic practice problems
 * with the points an interviewer expects you to cover. Each topic has a "learn" link
 * (links[i], aligned with topics[i]); each problem has labelled reference links.
 */

const CODING_PATTERNS = [
  { id: "arrays", name: "Arrays & Hashing", problems: [
    ["contains-duplicate", "Contains Duplicate", "E"],
    ["valid-anagram", "Valid Anagram", "E"],
    ["two-sum", "Two Sum", "E"],
    ["group-anagrams", "Group Anagrams", "M"],
    ["top-k-frequent-elements", "Top K Frequent Elements", "M"],
    ["encode-and-decode-strings", "Encode and Decode Strings", "M", true],
    ["product-of-array-except-self", "Product of Array Except Self", "M"],
    ["valid-sudoku", "Valid Sudoku", "M"],
    ["longest-consecutive-sequence", "Longest Consecutive Sequence", "M"]
  ]},
  { id: "two-pointers", name: "Two Pointers", problems: [
    ["valid-palindrome", "Valid Palindrome", "E"],
    ["two-sum-ii-input-array-is-sorted", "Two Sum II - Input Array Is Sorted", "M"],
    ["3sum", "3Sum", "M"],
    ["container-with-most-water", "Container With Most Water", "M"],
    ["trapping-rain-water", "Trapping Rain Water", "H"]
  ]},
  { id: "sliding-window", name: "Sliding Window", problems: [
    ["best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "E"],
    ["longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "M"],
    ["longest-repeating-character-replacement", "Longest Repeating Character Replacement", "M"],
    ["permutation-in-string", "Permutation in String", "M"],
    ["minimum-window-substring", "Minimum Window Substring", "H"],
    ["sliding-window-maximum", "Sliding Window Maximum", "H"]
  ]},
  { id: "stack", name: "Stack", problems: [
    ["valid-parentheses", "Valid Parentheses", "E"],
    ["min-stack", "Min Stack", "M"],
    ["evaluate-reverse-polish-notation", "Evaluate Reverse Polish Notation", "M"],
    ["generate-parentheses", "Generate Parentheses", "M"],
    ["daily-temperatures", "Daily Temperatures", "M"],
    ["car-fleet", "Car Fleet", "M"],
    ["largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "H"]
  ]},
  { id: "binary-search", name: "Binary Search", problems: [
    ["binary-search", "Binary Search", "E"],
    ["search-a-2d-matrix", "Search a 2D Matrix", "M"],
    ["koko-eating-bananas", "Koko Eating Bananas", "M"],
    ["find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "M"],
    ["search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "M"],
    ["time-based-key-value-store", "Time Based Key-Value Store", "M"],
    ["median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "H"]
  ]},
  { id: "linked-list", name: "Linked List", problems: [
    ["reverse-linked-list", "Reverse Linked List", "E"],
    ["merge-two-sorted-lists", "Merge Two Sorted Lists", "E"],
    ["linked-list-cycle", "Linked List Cycle", "E"],
    ["reorder-list", "Reorder List", "M"],
    ["remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "M"],
    ["copy-list-with-random-pointer", "Copy List with Random Pointer", "M"],
    ["add-two-numbers", "Add Two Numbers", "M"],
    ["find-the-duplicate-number", "Find the Duplicate Number", "M"],
    ["lru-cache", "LRU Cache", "M"],
    ["merge-k-sorted-lists", "Merge k Sorted Lists", "H"],
    ["reverse-nodes-in-k-group", "Reverse Nodes in k-Group", "H"]
  ]},
  { id: "trees", name: "Trees", problems: [
    ["invert-binary-tree", "Invert Binary Tree", "E"],
    ["maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "E"],
    ["diameter-of-binary-tree", "Diameter of Binary Tree", "E"],
    ["balanced-binary-tree", "Balanced Binary Tree", "E"],
    ["same-tree", "Same Tree", "E"],
    ["subtree-of-another-tree", "Subtree of Another Tree", "E"],
    ["lowest-common-ancestor-of-a-binary-search-tree", "Lowest Common Ancestor of a BST", "M"],
    ["binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "M"],
    ["binary-tree-right-side-view", "Binary Tree Right Side View", "M"],
    ["count-good-nodes-in-binary-tree", "Count Good Nodes in Binary Tree", "M"],
    ["validate-binary-search-tree", "Validate Binary Search Tree", "M"],
    ["kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "M"],
    ["construct-binary-tree-from-preorder-and-inorder-traversal", "Construct Binary Tree from Preorder and Inorder", "M"],
    ["binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "H"],
    ["serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "H"]
  ]},
  { id: "heap", name: "Heap / Priority Queue", problems: [
    ["kth-largest-element-in-a-stream", "Kth Largest Element in a Stream", "E"],
    ["last-stone-weight", "Last Stone Weight", "E"],
    ["k-closest-points-to-origin", "K Closest Points to Origin", "M"],
    ["kth-largest-element-in-an-array", "Kth Largest Element in an Array", "M"],
    ["task-scheduler", "Task Scheduler", "M"],
    ["design-twitter", "Design Twitter", "M"],
    ["find-median-from-data-stream", "Find Median from Data Stream", "H"]
  ]},
  { id: "backtracking", name: "Backtracking", problems: [
    ["subsets", "Subsets", "M"],
    ["combination-sum", "Combination Sum", "M"],
    ["permutations", "Permutations", "M"],
    ["subsets-ii", "Subsets II", "M"],
    ["combination-sum-ii", "Combination Sum II", "M"],
    ["word-search", "Word Search", "M"],
    ["palindrome-partitioning", "Palindrome Partitioning", "M"],
    ["letter-combinations-of-a-phone-number", "Letter Combinations of a Phone Number", "M"],
    ["n-queens", "N-Queens", "H"]
  ]},
  { id: "tries", name: "Tries", problems: [
    ["implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "M"],
    ["design-add-and-search-words-data-structure", "Design Add and Search Words Data Structure", "M"],
    ["word-search-ii", "Word Search II", "H"]
  ]},
  { id: "graphs", name: "Graphs", problems: [
    ["number-of-islands", "Number of Islands", "M"],
    ["max-area-of-island", "Max Area of Island", "M"],
    ["clone-graph", "Clone Graph", "M"],
    ["walls-and-gates", "Walls and Gates", "M", true],
    ["rotting-oranges", "Rotting Oranges", "M"],
    ["pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "M"],
    ["surrounded-regions", "Surrounded Regions", "M"],
    ["course-schedule", "Course Schedule", "M"],
    ["course-schedule-ii", "Course Schedule II", "M"],
    ["graph-valid-tree", "Graph Valid Tree", "M", true],
    ["number-of-connected-components-in-an-undirected-graph", "Number of Connected Components in an Undirected Graph", "M", true],
    ["redundant-connection", "Redundant Connection", "M"],
    ["word-ladder", "Word Ladder", "H"]
  ]},
  { id: "adv-graphs", name: "Advanced Graphs", problems: [
    ["network-delay-time", "Network Delay Time", "M"],
    ["reconstruct-itinerary", "Reconstruct Itinerary", "H"],
    ["min-cost-to-connect-all-points", "Min Cost to Connect All Points", "M"],
    ["swim-in-rising-water", "Swim in Rising Water", "H"],
    ["alien-dictionary", "Alien Dictionary", "H", true],
    ["cheapest-flights-within-k-stops", "Cheapest Flights Within K Stops", "M"]
  ]},
  { id: "dp1", name: "1-D Dynamic Programming", problems: [
    ["climbing-stairs", "Climbing Stairs", "E"],
    ["min-cost-climbing-stairs", "Min Cost Climbing Stairs", "E"],
    ["house-robber", "House Robber", "M"],
    ["house-robber-ii", "House Robber II", "M"],
    ["longest-palindromic-substring", "Longest Palindromic Substring", "M"],
    ["palindromic-substrings", "Palindromic Substrings", "M"],
    ["decode-ways", "Decode Ways", "M"],
    ["coin-change", "Coin Change", "M"],
    ["maximum-product-subarray", "Maximum Product Subarray", "M"],
    ["word-break", "Word Break", "M"],
    ["longest-increasing-subsequence", "Longest Increasing Subsequence", "M"],
    ["partition-equal-subset-sum", "Partition Equal Subset Sum", "M"]
  ]},
  { id: "dp2", name: "2-D Dynamic Programming", problems: [
    ["unique-paths", "Unique Paths", "M"],
    ["longest-common-subsequence", "Longest Common Subsequence", "M"],
    ["best-time-to-buy-and-sell-stock-with-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "M"],
    ["coin-change-ii", "Coin Change II", "M"],
    ["target-sum", "Target Sum", "M"],
    ["interleaving-string", "Interleaving String", "M"],
    ["edit-distance", "Edit Distance", "M"],
    ["longest-increasing-path-in-a-matrix", "Longest Increasing Path in a Matrix", "H"],
    ["distinct-subsequences", "Distinct Subsequences", "H"],
    ["burst-balloons", "Burst Balloons", "H"],
    ["regular-expression-matching", "Regular Expression Matching", "H"]
  ]},
  { id: "greedy", name: "Greedy", problems: [
    ["maximum-subarray", "Maximum Subarray", "M"],
    ["jump-game", "Jump Game", "M"],
    ["jump-game-ii", "Jump Game II", "M"],
    ["gas-station", "Gas Station", "M"],
    ["hand-of-straights", "Hand of Straights", "M"],
    ["merge-triplets-to-form-target-triplet", "Merge Triplets to Form Target Triplet", "M"],
    ["partition-labels", "Partition Labels", "M"],
    ["valid-parenthesis-string", "Valid Parenthesis String", "M"]
  ]},
  { id: "intervals", name: "Intervals", problems: [
    ["insert-interval", "Insert Interval", "M"],
    ["merge-intervals", "Merge Intervals", "M"],
    ["non-overlapping-intervals", "Non-overlapping Intervals", "M"],
    ["meeting-rooms", "Meeting Rooms", "E", true],
    ["meeting-rooms-ii", "Meeting Rooms II", "M", true],
    ["minimum-interval-to-include-each-query", "Minimum Interval to Include Each Query", "H"]
  ]},
  { id: "math", name: "Math & Geometry", problems: [
    ["rotate-image", "Rotate Image", "M"],
    ["spiral-matrix", "Spiral Matrix", "M"],
    ["set-matrix-zeroes", "Set Matrix Zeroes", "M"],
    ["happy-number", "Happy Number", "E"],
    ["plus-one", "Plus One", "E"],
    ["powx-n", "Pow(x, n)", "M"],
    ["multiply-strings", "Multiply Strings", "M"],
    ["detect-squares", "Detect Squares", "M"]
  ]},
  { id: "bits", name: "Bit Manipulation", problems: [
    ["single-number", "Single Number", "E"],
    ["number-of-1-bits", "Number of 1 Bits", "E"],
    ["counting-bits", "Counting Bits", "E"],
    ["reverse-bits", "Reverse Bits", "E"],
    ["missing-number", "Missing Number", "E"],
    ["sum-of-two-integers", "Sum of Two Integers", "M"],
    ["reverse-integer", "Reverse Integer", "M"]
  ]}
];

const SYSTEM_DESIGN = {
  // Roadmap weeks: each topic is a checkable item; videos are the post's linked resources.
  roadmap: [
    { id: "w1", name: "Week 1 - Foundations", topics: [
      "Scalability, reliability, maintainability",
      "Core components: client, server, API, database",
      "REST vs GraphQL vs gRPC",
      "Functional vs non-functional requirements",
      "Back-of-envelope estimation (QPS, storage, bandwidth)"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#performance-vs-scalability",
      "https://github.com/donnemartin/system-design-primer#system-design-topics-start-here",
      "https://github.com/donnemartin/system-design-primer#rpc-and-rest-calls-comparison",
      "https://github.com/donnemartin/system-design-primer#step-1-outline-use-cases-constraints-and-assumptions",
      "https://github.com/donnemartin/system-design-primer#back-of-the-envelope-calculations"
    ], videos: ["https://youtu.be/SqcXvc3ZmRU", "https://youtu.be/m8Icp_Cid5o", "https://youtu.be/s9Qh9fWeOAk"] },
    { id: "w2", name: "Week 2 - Scaling & Load Balancing", topics: [
      "Vertical vs horizontal scaling",
      "Load balancer algorithms: round robin, least connections",
      "L4 vs L7 load balancing",
      "Stateless services",
      "Health checks and failover"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#horizontal-scaling",
      "https://github.com/donnemartin/system-design-primer#load-balancer",
      "https://github.com/donnemartin/system-design-primer#layer-4-load-balancing",
      "https://github.com/donnemartin/system-design-primer#application-layer",
      "https://github.com/donnemartin/system-design-primer#fail-over"
    ], videos: ["https://youtu.be/K0Ta65OqQkY", "https://youtu.be/C842vFY5kRo"] },
    { id: "w3", name: "Week 3 - Databases & Partitioning", topics: [
      "SQL vs NoSQL - when to use each",
      "Replication: primary / replica",
      "Sharding: hash vs range, hotspots",
      "CAP theorem",
      "Indexes and query performance"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#sql-or-nosql",
      "https://github.com/donnemartin/system-design-primer#master-slave-replication",
      "https://github.com/donnemartin/system-design-primer#sharding",
      "https://github.com/donnemartin/system-design-primer#cap-theorem",
      "https://use-the-index-luke.com/"
    ], videos: ["https://youtu.be/5faMjKuB9bc", "https://youtu.be/C842vFY5kRo"] },
    { id: "w4", name: "Week 4 - Caching & CDN", topics: [
      "Cache-aside, write-through, write-back",
      "Eviction: LRU, LFU, TTL",
      "Cache invalidation",
      "CDNs (push vs pull)",
      "Latency vs throughput"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#when-to-update-the-cache",
      "https://github.com/donnemartin/system-design-primer#cache",
      "https://github.com/donnemartin/system-design-primer#disadvantages-cache",
      "https://github.com/donnemartin/system-design-primer#content-delivery-network",
      "https://github.com/donnemartin/system-design-primer#latency-vs-throughput"
    ], videos: ["https://youtu.be/U3RkDLtS7uY"] },
    { id: "w5", name: "Week 5 - Distributed Building Blocks", topics: [
      "Consistent hashing",
      "Rate limiting: token bucket, sliding window",
      "Blob / object storage (S3-style)"
    ],
    links: [
      "https://en.wikipedia.org/wiki/Consistent_hashing",
      "https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter",
      "https://aws.amazon.com/what-is/object-storage/"
    ], videos: ["https://youtu.be/zaRkONvyGr8"] },
    { id: "w6", name: "Week 6 - Event-Driven Architecture", topics: [
      "Message queues and why go async",
      "Kafka vs RabbitMQ / SQS",
      "Publish-subscribe",
      "Dead letter queues, retries, idempotent consumers"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#asynchronism",
      "https://aws.amazon.com/compare/the-difference-between-rabbitmq-and-kafka/",
      "https://aws.amazon.com/what-is/pub-sub-messaging/",
      "https://aws.amazon.com/what-is/dead-letter-queue/"
    ], videos: ["https://youtu.be/oUJbuFMyBDk", "https://youtu.be/uvb00oaa3k8"] },
    { id: "w7", name: "Week 7 - Networking, APIs & Microservices", topics: [
      "HTTP/HTTPS and WebSockets",
      "REST design: status codes, pagination, idempotency",
      "Monolith vs microservices",
      "API gateways"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#hypertext-transfer-protocol-http",
      "https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest",
      "https://github.com/donnemartin/system-design-primer#microservices",
      "https://microservices.io/patterns/apigateway.html"
    ], videos: ["https://youtu.be/1BfCnjr_Vjg", "https://youtu.be/mpQZVYPuDGU", "https://youtu.be/C842vFY5kRo"] },
    { id: "w8", name: "Week 8 - Security & Auth", topics: [
      "Authentication vs authorization",
      "Sessions vs tokens (JWT)",
      "HTTPS / TLS",
      "Password hashing (bcrypt / argon2)",
      "CORS"
    ],
    links: [
      "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
      "https://jwt.io/introduction",
      "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security",
      "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
    ], videos: ["https://youtu.be/UBUNrFtufWo"] },
    { id: "w9", name: "Week 9 - The HLD Interview Framework", topics: [
      "1. Clarify functional + non-functional requirements",
      "2. Estimate scale",
      "3. Draw the high-level architecture",
      "4. Deep-dive the critical components",
      "5. Discuss trade-offs and bottlenecks"
    ],
    links: [
      "https://github.com/donnemartin/system-design-primer#step-1-outline-use-cases-constraints-and-assumptions",
      "https://github.com/donnemartin/system-design-primer#back-of-the-envelope-calculations",
      "https://github.com/donnemartin/system-design-primer#step-2-create-a-high-level-design",
      "https://github.com/donnemartin/system-design-primer#step-3-design-core-components",
      "https://github.com/donnemartin/system-design-primer#step-4-scale-the-design"
    ], videos: [] },
    { id: "w10", name: "Week 10 - Low-Level Design", topics: [
      "Creational: Singleton, Factory, Builder, Prototype",
      "Structural: Adapter, Decorator, Proxy, Facade, Composite",
      "Behavioral: Observer, Strategy, Command, State, Chain of Responsibility",
      "SOLID principles",
      "UML: class, sequence, component diagrams"
    ],
    links: [
      "https://refactoring.guru/design-patterns/creational-patterns",
      "https://refactoring.guru/design-patterns/structural-patterns",
      "https://refactoring.guru/design-patterns/behavioral-patterns",
      "https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design",
      "https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-uml/"
    ], videos: ["https://youtu.be/v9ejT8FO-7I", "https://youtu.be/kF7rQmSRlq0", "https://youtu.be/_jDNAf3CzeY", "https://youtu.be/rliSgjoOFTs"] },
    { id: "w11", name: "Week 11 - Interview Prep & Mocks", topics: [
      "Predict a company's questions with ChatGPT",
      "Go through the top 75 frequently asked SD questions",
      "Watch a full mock: Design LeetCode",
      "Watch a full mock: Design TikTok"
    ],
    links: [
      null,
      "https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions",
      "https://youtu.be/QBHTbtWSECg",
      "https://youtu.be/Z-0g_aJL5Fw"
    ], videos: [
      "https://youtu.be/LsDZab4GpVc",
      "https://youtu.be/QBHTbtWSECg",
      "https://youtu.be/Z-0g_aJL5Fw"
    ] }
  ],
  // Classic HLD problems with the points worth covering.
  problems: [
    { id: "url-shortener", name: "URL Shortener (bit.ly)", points: [
      "Key generation: base62 counter vs hash + collision check",
      "Read-heavy: cache hot short codes, 301 vs 302 redirect",
      "Analytics via async click events"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly" }, { label: "Primer solution", url: "https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md" }] },
    { id: "rate-limiter", name: "Rate Limiter", points: [
      "Token bucket vs sliding window log/counter",
      "Shared counters in Redis, atomic ops / Lua",
      "Where it lives: gateway vs service; 429 + Retry-After"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter" }] },
    { id: "news-feed", name: "Twitter / Instagram News Feed", points: [
      "Fan-out on write vs read; hybrid for celebrities",
      "Feed cache per user, pagination by cursor",
      "Media in object storage + CDN"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed" }, { label: "Primer solution", url: "https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md" }] },
    { id: "chat", name: "Chat System (WhatsApp)", points: [
      "WebSocket gateways + presence service",
      "Message ordering per conversation, delivery/read receipts",
      "Offline storage and push notifications; group fan-out"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp" }] },
    { id: "notification", name: "Notification System", points: [
      "Queue per channel (push, SMS, email) with workers",
      "User preferences, templates, rate limits",
      "Retries, dedupe/idempotency keys, DLQ"
    ], links: [{ label: "Async queues", url: "https://github.com/donnemartin/system-design-primer#asynchronism" }] },
    { id: "ride-hailing", name: "Uber / Ride Hailing", points: [
      "Driver location updates; geo-index (geohash / quadtree)",
      "Matching service and trip state machine",
      "Surge pricing, consistency for trip assignment"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber" }] },
    { id: "video", name: "YouTube / Netflix", points: [
      "Upload -> transcode pipeline -> multiple bitrates",
      "Adaptive streaming (HLS/DASH) via CDN",
      "Metadata DB, view counts, recommendations async"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube" }] },
    { id: "file-storage", name: "Dropbox / Google Drive", points: [
      "Chunking + dedupe by content hash",
      "Metadata service vs block storage",
      "Sync and conflict resolution across devices"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox" }] },
    { id: "kv-store", name: "Distributed Key-Value Store", points: [
      "Consistent hashing + replication factor N",
      "Quorum reads/writes (R + W > N)",
      "Vector clocks / last-write-wins, hinted handoff, gossip"
    ], links: [{ label: "Dynamo paper", url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf" }] },
    { id: "typeahead", name: "Search Autocomplete", points: [
      "Trie with top-k per prefix, precomputed offline",
      "Cache popular prefixes close to users",
      "Aggregating query logs to refresh rankings"
    ], links: [{ label: "Top-K breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k" }] },
    { id: "web-crawler", name: "Web Crawler", points: [
      "URL frontier with politeness per host",
      "Dedupe URLs and content (bloom filter / hashes)",
      "Robots.txt, distributed workers, recrawl schedule"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler" }, { label: "Primer solution", url: "https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/web_crawler/README.md" }] },
    { id: "ticket-booking", name: "Ticket Booking (BookMyShow)", points: [
      "Seat hold with TTL to avoid double-booking",
      "Strong consistency / locking for seat inventory",
      "Payment flow with idempotency + timeouts"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster" }] },
    { id: "leetcode", name: "Online Judge (Design LeetCode)", points: [
      "Submission queue + sandboxed runners",
      "Contest leaderboard (sorted sets), spikes at contest start",
      "Problem/test-case storage, result polling or websockets"
    ], links: [{ label: "Breakdown", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode" }, { label: "Mock interview", url: "https://youtu.be/QBHTbtWSECg" }] }
  ]
};

function sdTopicKey(weekId, idx) {
  return `${weekId}-${idx}`;
}
