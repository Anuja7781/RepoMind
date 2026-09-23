// ─── Change Impact Analysis Mock Data ────────────────────────────────────────
// Replace analyzeImpact() with a real FastAPI call later.

export interface ImpactTarget {
  id: string
  label: string
  path: string
  type: "file" | "class" | "function" | "module"
}

export interface ChangeType {
  id: string
  label: string
}

export interface ImpactSimStep {
  id: string
  label: string
  duration: number
}

export interface ImpactNode {
  id: string
  label: string
  path: string
  relationship: "source" | "used_by" | "calls" | "tested_by" | "affects_api"
  x: number
  y: number
  color: string
  reason: string
  riskLevel: "high" | "medium" | "low"
}

export interface ImpactEdge {
  source: string
  target: string
  label: string
}

export interface ImpactResult {
  score: number
  level: "HIGH" | "MEDIUM" | "LOW"
  filesAffected: number
  functionsAffected: number
  modulesAffected: number
  apisAffected: number
  testsAffected: number
  depsAffected: number
  nodes: ImpactNode[]
  edges: ImpactEdge[]
  explanation: string[]
  risk: "HIGH" | "MEDIUM" | "LOW"
  confidence: number
  involvedAgents: string[]
}

export const IMPACT_TARGETS: ImpactTarget[] = [
  { id: "payment", label: "PaymentService.ts", path: "src/services/PaymentService.ts", type: "file" },
  { id: "traffic-ctrl", label: "TrafficController.py", path: "src/controllers/TrafficController.py", type: "file" },
  { id: "auth", label: "AuthService.ts", path: "src/auth/AuthService.ts", type: "file" },
  { id: "user-model", label: "UserModel.ts", path: "src/models/UserModel.ts", type: "class" },
  { id: "router", label: "AppRouter.tsx", path: "src/routing/AppRouter.tsx", type: "module" },
  { id: "process-payment", label: "processPayment()", path: "src/services/PaymentService.ts:42", type: "function" },
  { id: "db-client", label: "DatabaseClient.ts", path: "src/db/DatabaseClient.ts", type: "file" },
  { id: "api-gateway", label: "APIGateway.ts", path: "src/gateway/APIGateway.ts", type: "file" },
]

export const CHANGE_TYPES: ChangeType[] = [
  { id: "modify-fn",    label: "Modify Function" },
  { id: "remove-file",  label: "Remove File" },
  { id: "modify-file",  label: "Modify File" },
  { id: "remove-fn",    label: "Remove Function" },
  { id: "add-dep",      label: "Add Dependency" },
  { id: "remove-dep",   label: "Remove Dependency" },
  { id: "change-api",   label: "Change API" },
  { id: "add-file",     label: "Add File" },
]

export const SIM_STEPS: ImpactSimStep[] = [
  { id: "repo-scan",   label: "Repository Scanner",       duration: 600  },
  { id: "dep-graph",   label: "Dependency Graph",          duration: 700  },
  { id: "call-graph",  label: "Call Graph",                duration: 650  },
  { id: "kg",          label: "Knowledge Graph",           duration: 750  },
  { id: "impact-agent",label: "Impact Analysis Agent",     duration: 900  },
  { id: "arch-agent",  label: "Architecture Agent",        duration: 800  },
  { id: "bug-agent",   label: "Bug Prediction Agent",      duration: 750  },
  { id: "test-impact", label: "Test Impact Analysis",      duration: 700  },
  { id: "llm",         label: "LLM Reasoning",             duration: 950  },
]

const IMPACT_NODES_PAYMENT: ImpactNode[] = [
  { id: "payment",          label: "PaymentService",      path: "src/services/PaymentService.ts",    relationship: "source",      x: 300, y: 200, color: "#4f46e5", reason: "Source of change",                                                 riskLevel: "high"   },
  { id: "checkout",         label: "CheckoutService",     path: "src/services/CheckoutService.ts",   relationship: "used_by",     x: 160, y: 100, color: "#dc2626", reason: "Directly calls PaymentService.processPayment()",                    riskLevel: "high"   },
  { id: "order",            label: "OrderService",        path: "src/services/OrderService.ts",      relationship: "used_by",     x: 440, y: 100, color: "#dc2626", reason: "Uses PaymentService for order confirmation",                        riskLevel: "high"   },
  { id: "payment-ctrl",     label: "PaymentController",   path: "src/controllers/PaymentController.ts", relationship: "used_by",  x: 80,  y: 200, color: "#ea580c", reason: "PaymentController routes depend on PaymentService",                 riskLevel: "high"   },
  { id: "payment-test",     label: "PaymentTest",         path: "tests/PaymentService.test.ts",      relationship: "tested_by",   x: 160, y: 310, color: "#d97706", reason: "8 test cases directly test PaymentService methods",                  riskLevel: "medium" },
  { id: "payment-gateway",  label: "PaymentGateway",      path: "src/gateways/PaymentGateway.ts",    relationship: "calls",       x: 440, y: 310, color: "#059669", reason: "PaymentService delegates to PaymentGateway for Stripe",             riskLevel: "medium" },
  { id: "invoice",          label: "InvoiceGenerator",    path: "src/services/InvoiceGenerator.ts",  relationship: "used_by",     x: 300, y: 330, color: "#ea580c", reason: "Generates invoice after payment processed",                         riskLevel: "medium" },
  { id: "refund",           label: "RefundService",       path: "src/services/RefundService.ts",     relationship: "used_by",     x: 520, y: 200, color: "#ea580c", reason: "RefundService extends PaymentService logic",                        riskLevel: "medium" },
  { id: "checkout-api",     label: "/api/checkout",       path: "src/routes/checkout.ts",            relationship: "affects_api", x: 80,  y: 310, color: "#6366f1", reason: "3 API routes will return 500 if PaymentService is removed",         riskLevel: "high"   },
]

const IMPACT_NODES_TRAFFIC: ImpactNode[] = [
  { id: "traffic-ctrl",    label: "TrafficController",   path: "src/controllers/TrafficController.py", relationship: "source",      x: 300, y: 200, color: "#4f46e5", reason: "Source of change",                                               riskLevel: "high"   },
  { id: "signal-manager",  label: "SignalManager",       path: "src/core/SignalManager.py",            relationship: "used_by",     x: 150, y: 100, color: "#dc2626", reason: "Receives timing commands from TrafficController",                  riskLevel: "high"   },
  { id: "ml-engine",       label: "MLPredictionEngine",  path: "src/ml/MLPredictionEngine.py",         relationship: "used_by",     x: 450, y: 100, color: "#dc2626", reason: "Feeds predictions into controller routing logic",                  riskLevel: "high"   },
  { id: "camera-feed",     label: "CameraFeedHandler",   path: "src/sensors/CameraFeedHandler.py",     relationship: "calls",       x: 80,  y: 200, color: "#059669", reason: "Controller pulls frame data from camera feeds",                    riskLevel: "medium" },
  { id: "traffic-api",     label: "/api/traffic",        path: "src/routes/traffic.py",                relationship: "affects_api", x: 520, y: 200, color: "#6366f1", reason: "REST endpoints proxy to TrafficController",                       riskLevel: "high"   },
  { id: "ctrl-test",       label: "ControllerTests",     path: "tests/test_traffic_controller.py",     relationship: "tested_by",   x: 160, y: 310, color: "#d97706", reason: "12 test cases cover controller routing logic",                    riskLevel: "medium" },
  { id: "dashboard",       label: "DashboardService",    path: "src/services/DashboardService.py",     relationship: "used_by",     x: 440, y: 310, color: "#ea580c", reason: "Dashboard reads live state from TrafficController",                riskLevel: "medium" },
  { id: "alert-system",    label: "AlertSystem",         path: "src/alerts/AlertSystem.py",            relationship: "used_by",     x: 300, y: 330, color: "#ea580c", reason: "Alerts triggered by controller anomaly detection",                riskLevel: "medium" },
]

export function getImpactResult(targetId: string, changeTypeId: string): ImpactResult {
  const isRemove = changeTypeId === "remove-file" || changeTypeId === "remove-fn"
  const isHigh   = isRemove || changeTypeId === "change-api"

  if (targetId === "traffic-ctrl") {
    return {
      score: 78, level: "HIGH",
      filesAffected: 11, functionsAffected: 22, modulesAffected: 5,
      apisAffected: 2, testsAffected: 12, depsAffected: 8,
      nodes: IMPACT_NODES_TRAFFIC,
      edges: [
        { source: "traffic-ctrl", target: "signal-manager", label: "commands" },
        { source: "traffic-ctrl", target: "ml-engine",      label: "receives predictions" },
        { source: "traffic-ctrl", target: "camera-feed",    label: "calls" },
        { source: "traffic-ctrl", target: "traffic-api",    label: "exposed via" },
        { source: "ctrl-test",    target: "traffic-ctrl",   label: "tests" },
        { source: "dashboard",    target: "traffic-ctrl",   label: "reads" },
        { source: "alert-system", target: "traffic-ctrl",   label: "monitors" },
      ],
      explanation: [
        "SignalManager will lose timing commands from TrafficController, causing traffic signals to remain in last known state.",
        "MLPredictionEngine predictions will not be acted upon, reducing system intelligence.",
        "12 test cases in ControllerTests will fail immediately.",
        "2 REST API routes (/api/traffic, /api/signals) will return 500 errors.",
        "DashboardService will stop receiving live traffic state updates.",
        "AlertSystem anomaly detection will be non-functional.",
      ],
      risk: "HIGH", confidence: 91,
      involvedAgents: ["Repository Analysis Agent","Architecture Recovery Agent","Dependency Analysis","Bug Prediction Agent","Code Quality Agent","Recommendation Agent"],
    }
  }

  return {
    score: isHigh ? 82 : 54, level: isHigh ? "HIGH" : "MEDIUM",
    filesAffected: isHigh ? 14 : 7,
    functionsAffected: isHigh ? 27 : 12,
    modulesAffected: isHigh ? 6 : 3,
    apisAffected: isHigh ? 3 : 1,
    testsAffected: isHigh ? 8 : 4,
    depsAffected: isHigh ? 11 : 5,
    nodes: IMPACT_NODES_PAYMENT,
    edges: [
      { source: "payment",         target: "checkout",       label: "used by" },
      { source: "payment",         target: "order",          label: "used by" },
      { source: "payment",         target: "payment-ctrl",   label: "used by" },
      { source: "payment",         target: "payment-gateway",label: "calls" },
      { source: "payment-test",    target: "payment",        label: "tests" },
      { source: "invoice",         target: "payment",        label: "depends on" },
      { source: "refund",          target: "payment",        label: "extends" },
      { source: "checkout-api",    target: "payment",        label: "routes to" },
    ],
    explanation: isRemove
      ? [
          "CheckoutService will lose its payment dependency and cannot process transactions.",
          "PaymentController will become disconnected, returning 503 on all payment routes.",
          "8 test cases in PaymentTest will fail immediately.",
          "3 API routes (/api/checkout, /api/pay, /api/refund) will require modification.",
          "InvoiceGenerator will fail to generate post-payment receipts.",
          "Order processing pipeline will stall at the payment confirmation step.",
        ]
      : [
          "CheckoutService may behave unexpectedly if the modified function changes its signature.",
          "OrderService payment confirmation logic may need updating.",
          "4 test cases may require adjustments to match new behavior.",
          "1 API route may need parameter validation updates.",
          "InvoiceGenerator should be tested for compatibility with changed output.",
        ],
    risk: isHigh ? "HIGH" : "MEDIUM",
    confidence: isHigh ? 89 : 74,
    involvedAgents: ["Repository Analysis Agent","Architecture Recovery Agent","Dependency Analysis","Bug Prediction Agent","Code Quality Agent","Recommendation Agent"],
  }
}

// ─── Architecture Drift Mock Data ─────────────────────────────────────────────

export interface ArchLayer {
  id: string
  label: string
  color: string
  expected: boolean
  implemented: boolean
  violation?: string
}

export interface DriftViolation {
  id: string
  severity: "critical" | "high" | "medium"
  from: string
  to: string
  description: string
  recommendation: string
}

export interface TimelineSnapshot {
  year: number
  conformance: number
  violations: number
  unexpected: number
  description: string
}

export interface DriftResult {
  conformance: number
  driftLevel: "LOW" | "MEDIUM" | "HIGH"
  expectedComponents: number
  implementedComponents: number
  unexpectedDeps: number
  missingComponents: number
  violations: DriftViolation[]
  timeline: TimelineSnapshot[]
  expectedLayers: ArchLayer[]
  extraEdges: { from: string; to: string; label: string; type: "violation" | "warning" }[]
}

export const ARCHITECTURE_DRIFT: DriftResult = {
  conformance: 72, driftLevel: "MEDIUM",
  expectedComponents: 12, implementedComponents: 14,
  unexpectedDeps: 5, missingComponents: 2,
  violations: [
    {
      id: "v1", severity: "critical",
      from: "PaymentService", to: "Database",
      description: "PaymentService directly accesses the Database, bypassing the intended Data Access Layer / Repository pattern.",
      recommendation: "Introduce a PaymentRepository class that mediates all database access. PaymentService should only call PaymentRepository methods.",
    },
    {
      id: "v2", severity: "high",
      from: "Frontend", to: "Database",
      description: "Frontend component makes direct database queries via an exposed connection string, bypassing the API layer entirely.",
      recommendation: "Remove the direct database reference from the frontend. All data access must go through the API Layer.",
    },
    {
      id: "v3", severity: "high",
      from: "LegacyUtils", to: "APIGateway",
      description: "LegacyUtils module makes outbound calls to APIGateway, creating an unexpected reverse dependency from the utility layer to the API layer.",
      recommendation: "Move the APIGateway-calling logic from LegacyUtils into a proper service class in the Service Layer.",
    },
    {
      id: "v4", severity: "medium",
      from: "OrderService", to: "ExternalAPI",
      description: "OrderService calls an external third-party API directly instead of going through the intended ExternalAPIAdapter.",
      recommendation: "Create an ExternalAPIAdapter in the Infrastructure layer and route OrderService calls through it.",
    },
  ],
  expectedLayers: [
    { id: "frontend", label: "Frontend", color: "#4f46e5", expected: true,  implemented: true  },
    { id: "api",      label: "API Layer", color: "#0ea5e9", expected: true,  implemented: true  },
    { id: "service",  label: "Service Layer", color: "#059669", expected: true,  implemented: true  },
    { id: "repo",     label: "Repository Layer", color: "#6366f1", expected: true,  implemented: true,  violation: "PaymentService bypasses" },
    { id: "db",       label: "Database", color: "#64748b", expected: true,  implemented: true  },
    { id: "legacy",   label: "LegacyUtils", color: "#d97706", expected: false, implemented: true,  violation: "Unexpected module" },
    { id: "external", label: "ExternalAPI", color: "#ea580c", expected: false, implemented: true  },
  ],
  extraEdges: [
    { from: "payment-service", to: "db",       label: "VIOLATION: Direct DB access",  type: "violation" },
    { from: "frontend",        to: "db",        label: "VIOLATION: Bypasses API Layer", type: "violation" },
    { from: "legacy",          to: "api",       label: "WARNING: Reverse dependency",  type: "violation" },
    { from: "order-service",   to: "external",  label: "WARNING: No adapter",          type: "warning"   },
    { from: "frontend",        to: "external",  label: "WARNING: Undocumented",        type: "warning"   },
  ],
  timeline: [
    { year: 2023, conformance: 96, violations: 0, unexpected: 0, description: "Architecture matches documentation. Clean layered structure." },
    { year: 2024, conformance: 88, violations: 1, unexpected: 1, description: "First architectural violation introduced: PaymentService direct DB access." },
    { year: 2025, conformance: 78, violations: 3, unexpected: 3, description: "3 unexpected dependencies detected. LegacyUtils reverse dep added." },
    { year: 2026, conformance: 72, violations: 4, unexpected: 5, description: "Architecture drift detected. Significant divergence from documentation." },
  ],
}
