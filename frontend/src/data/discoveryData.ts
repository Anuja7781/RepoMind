// ─── Multi-Repository Discovery Mock Data ────────────────────────────────────
// Replace searchRepositories() / compareRepositories() with FastAPI calls later.

export interface ScoreBreakdown {
  topicRelevance:   number
  architecture:     number
  codeQuality:      number
  documentation:    number
  security:         number
  maintainability:  number
  activity:         number
}

export interface DiscoveredRepo {
  id: string
  name: string
  owner: string
  description: string
  stars: number
  forks: number
  language: string
  lastCommit: string
  overallScore: number
  breakdown: ScoreBreakdown
  whyRecommended: string[]
  topicMatches: string[]
  architecture: string[]
  strengths: string[]
  weaknesses: string[]
  securityIssues: number
  testCoverage: number
  dependencies: number
  linesOfCode: number
}

export interface SearchSimStep {
  id: string
  label: string
  duration: number
  count?: string
}

export const SEARCH_SIM_STEPS: SearchSimStep[] = [
  { id: "understand", label: "Understanding project topic...",    duration: 800  },
  { id: "search",     label: "Searching GitHub...",               duration: 1200, count: "24 repositories found" },
  { id: "filter",     label: "Filtering repositories...",         duration: 900,  count: "12 relevant repositories" },
  { id: "analyze",    label: "Running repository analysis...",    duration: 1400, count: "Top 5 selected" },
  { id: "agents",     label: "Activating AI agents...",           duration: 1100, count: "Analysis started" },
  { id: "rank",       label: "Ranking repositories...",           duration: 1000  },
]

export const DISCOVERED_REPOS: DiscoveredRepo[] = [
  {
    id: "trafficmind",
    name: "TrafficMind-AI",
    owner: "ai-research-lab",
    description: "An intelligent traffic management system using deep learning, computer vision, and adaptive signal control for urban intersections.",
    stars: 2840, forks: 612, language: "Python", lastCommit: "2 days ago",
    overallScore: 92,
    breakdown: { topicRelevance: 96, architecture: 91, codeQuality: 87, documentation: 94, security: 89, maintainability: 90, activity: 93 },
    whyRecommended: [
      "Highest topic relevance across all found repositories",
      "Well-documented FastAPI + ML architecture",
      "Active development with regular commits",
      "Strong test coverage (84%) for core modules",
      "Matches 6 of 7 requested project characteristics",
      "Suitable complexity for intermediate-level implementation",
    ],
    topicMatches: ["AI-based traffic signal optimization","Computer vision vehicle detection","Adaptive signal control algorithm","Python + FastAPI implementation","Real-time traffic flow analysis"],
    architecture: ["Streamlit Dashboard","FastAPI Backend","ML Prediction Engine","OpenCV Vision Module","PostgreSQL + Redis"],
    strengths: ["Strong documentation","Active community","Modular ML pipeline","Production-ready deployment","Comprehensive test suite"],
    weaknesses: ["Heavy GPU dependency","Limited edge-case handling"],
    securityIssues: 2, testCoverage: 84, dependencies: 38, linesOfCode: 18400,
  },
  {
    id: "smarttraffic",
    name: "SmartTraffic-Control",
    owner: "urban-mobility",
    description: "Multi-intersection traffic control using reinforcement learning agents and real-time sensor integration.",
    stars: 1920, forks: 384, language: "Python", lastCommit: "5 days ago",
    overallScore: 87,
    breakdown: { topicRelevance: 91, architecture: 85, codeQuality: 89, documentation: 79, security: 90, maintainability: 86, activity: 88 },
    whyRecommended: ["Strong RL-based approach to signal control","High security score","Good code quality metrics"],
    topicMatches: ["Reinforcement learning for traffic","Multi-agent intersection control","SUMO traffic simulator integration","Python + PyTorch"],
    architecture: ["React Dashboard","Flask API","RL Training Engine","SUMO Simulator","SQLite"],
    strengths: ["Innovative RL approach","High security score","Clean codebase"],
    weaknesses: ["Limited documentation","Monolithic Flask backend","Outdated dependencies"],
    securityIssues: 1, testCoverage: 71, dependencies: 28, linesOfCode: 12200,
  },
  {
    id: "aitraffic",
    name: "AI-Traffic-Control",
    owner: "traffic-systems-org",
    description: "Open-source adaptive traffic control system with YOLO-based vehicle detection and deep Q-network optimization.",
    stars: 1340, forks: 298, language: "Python", lastCommit: "12 days ago",
    overallScore: 81,
    breakdown: { topicRelevance: 84, architecture: 78, codeQuality: 82, documentation: 85, security: 76, maintainability: 79, activity: 82 },
    whyRecommended: ["Good YOLO integration","Solid documentation","Easy to extend"],
    topicMatches: ["YOLO vehicle detection","DQN traffic optimization","Intersection simulation","Computer vision"],
    architecture: ["Streamlit UI","Python Backend","YOLO Detection","DQN Agent","SQLite"],
    strengths: ["Good documentation","Easy to extend","Clear architecture"],
    weaknesses: ["Lower security score","Moderate test coverage","Limited scalability"],
    securityIssues: 5, testCoverage: 62, dependencies: 22, linesOfCode: 9800,
  },
  {
    id: "trafficsim",
    name: "TrafficFlow-Optimizer",
    owner: "ml-transport",
    description: "Graph neural network approach to city-scale traffic flow optimization with dynamic routing.",
    stars: 890, forks: 167, language: "Python", lastCommit: "3 weeks ago",
    overallScore: 74,
    breakdown: { topicRelevance: 78, architecture: 72, codeQuality: 75, documentation: 68, security: 72, maintainability: 76, activity: 71 },
    whyRecommended: ["Novel GNN approach","City-scale simulation"],
    topicMatches: ["Graph neural network traffic","City-scale optimization","Dynamic routing algorithms"],
    architecture: ["Jupyter Notebooks","Python Scripts","GNN Model","CSV Data"],
    strengths: ["Innovative GNN approach","Good research value"],
    weaknesses: ["Research prototype quality","Poor documentation","No REST API","No tests"],
    securityIssues: 8, testCoverage: 28, dependencies: 14, linesOfCode: 6400,
  },
  {
    id: "urbanflow",
    name: "UrbanFlow-AI",
    owner: "smartcity-dev",
    description: "IoT-integrated smart traffic management with real-time sensor data fusion and predictive analytics.",
    stars: 640, forks: 88, language: "Python", lastCommit: "1 month ago",
    overallScore: 68,
    breakdown: { topicRelevance: 71, architecture: 65, codeQuality: 69, documentation: 62, security: 68, maintainability: 70, activity: 58 },
    whyRecommended: ["IoT integration","Real-world sensor data"],
    topicMatches: ["IoT traffic sensors","Real-time data fusion","Predictive analytics"],
    architecture: ["React Dashboard","Node.js API","Python ML","PostgreSQL","MQTT Broker"],
    strengths: ["Real IoT integration","Multi-language stack"],
    weaknesses: ["Low activity","Poor code quality","High technical debt","Weak documentation"],
    securityIssues: 12, testCoverage: 19, dependencies: 47, linesOfCode: 14200,
  },
]

export const COMPARISON_CATEGORIES = [
  { key: "overallScore",       label: "Overall Score" },
  { key: "topicRelevance",     label: "Topic Relevance",   breakdownKey: true },
  { key: "architecture",       label: "Architecture",       breakdownKey: true },
  { key: "codeQuality",        label: "Code Quality",       breakdownKey: true },
  { key: "security",           label: "Security",           breakdownKey: true },
  { key: "documentation",      label: "Documentation",      breakdownKey: true },
  { key: "maintainability",    label: "Maintainability",    breakdownKey: true },
  { key: "activity",           label: "Activity",           breakdownKey: true },
  { key: "testCoverage",       label: "Test Coverage (%)" },
  { key: "securityIssues",     label: "Security Issues",    inverse: true },
  { key: "dependencies",       label: "Dependencies" },
]

export function getScoreRating(score: number): "strong" | "moderate" | "weak" {
  if (score >= 80) return "strong"
  if (score >= 60) return "moderate"
  return "weak"
}

export function getRepoById(id: string): DiscoveredRepo | undefined {
  return DISCOVERED_REPOS.find(r => r.id === id)
}

// AI assistant responses for discovery questions
export const DISCOVERY_AI_RESPONSES: Record<string, { text: string; refs?: string[] }> = {
  "repository a": {
    text: "TrafficMind-AI (Repository A) ranks highest because it achieves 96% topic relevance — matching 6 of 7 requested characteristics including AI-based signal control, computer vision, Python implementation, and FastAPI backend. Its architecture score of 91 reflects a clean separation of concerns, and its 94 documentation score means you can get started quickly.",
  },
  "repository b": {
    text: "SmartTraffic-Control scores lower than TrafficMind-AI primarily due to weaker documentation (79 vs 94). Its documentation gap means onboarding would take longer. However, it has a higher security score (90) and its RL-based approach is more innovative than TrafficMind-AI's supervised learning pipeline.",
  },
  "why": {
    text: "TrafficMind-AI is recommended because it achieves the highest composite score (92/100), combining strong topic relevance (96%), excellent documentation (94), active development, and suitable complexity. The other repositories either have documentation gaps, lower activity, or architectural issues.",
  },
  "compare": {
    text: "TrafficMind-AI leads on topic relevance (96) and documentation (94). SmartTraffic-Control leads on security (90) and code quality (89). AI-Traffic-Control offers the best balance of simplicity and documentation. The primary differentiator is architecture quality — TrafficMind-AI's layered FastAPI design is the most production-ready.",
  },
  "security": {
    text: "SmartTraffic-Control has the fewest security issues (1). AI-Traffic-Control has 5, TrafficMind-AI has 2 (minor). UrbanFlow-AI should be avoided — it has 12 security issues including 3 high-severity vulnerabilities in its MQTT broker configuration and exposed API keys.",
  },
  "default": {
    text: "Based on the multi-repository analysis, TrafficMind-AI is the strongest match for an AI-based traffic management system. It combines a production-ready architecture with comprehensive documentation and strong test coverage. Would you like me to detail a specific aspect of the comparison?",
  },
}

export function getDiscoveryResponse(query: string): { text: string; refs?: string[] } {
  const lower = query.toLowerCase()
  for (const [k, v] of Object.entries(DISCOVERY_AI_RESPONSES)) {
    if (k !== "default" && lower.includes(k)) return v
  }
  return DISCOVERY_AI_RESPONSES.default
}
