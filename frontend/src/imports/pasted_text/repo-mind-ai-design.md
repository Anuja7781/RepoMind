REDESIGN AND POLISH THE EXISTING REPO-MIND AI FIGMA DESIGN

IMPORTANT:
This is a DESIGN-ONLY task.

Do NOT generate or modify backend code.
Do NOT connect APIs.
Do NOT remove existing product modules.
Do NOT convert this into a generic SaaS landing page.

We are finalizing the visual/product design in Figma first.
The frontend will be exported to code later and connected to a FastAPI backend separately.

Use the EXISTING RepoMind AI design as the foundation. Preserve the strong visual direction, graphs, layouts, components and overall concept, but clean up anything that looks like a generic template or unfinished demo.

==================================================
PRODUCT
==================================================

Product name:

RepoMind AI

RepoMind AI is an agentic developer-intelligence platform that analyzes GitHub repositories and helps developers understand:

- repository architecture
- dependencies
- code structure
- entities
- security
- bug risk
- documentation
- architecture drift
- change impact
- repository relationships
- AI-assisted developer intelligence

The design should feel like a serious developer tool used by engineers.

==================================================
1. OVERALL VISUAL DIRECTION
==================================================

Keep the existing premium dark developer-tool aesthetic.

Use:

- deep black / navy background
- violet / purple primary accent
- cyan / blue secondary accent
- subtle gradients
- thin borders
- restrained glow
- technical typography
- monospace typography for technical information
- generous spacing
- strong visual hierarchy
- sophisticated data visualization

The design should feel:

- premium
- technical
- intelligent
- futuristic
- professional
- developer-focused

Avoid:

- excessive neon
- excessive glassmorphism
- giant glowing elements
- excessive rounded cards
- generic startup/SaaS styling
- overly colorful dashboards
- unnecessary decoration

The interface should look like a real developer intelligence platform, not a marketing template.

==================================================
2. REMOVE TEMPLATE / GENERIC MARKETING CONTENT
==================================================

Inspect the entire Figma design.

Remove or replace generic SaaS/template elements such as:

- Take a Demo
- Book a Demo
- Contact Sales
- Pricing
- generic customer logos
- generic testimonials
- fake customer/company references
- irrelevant marketing statistics
- subscription CTAs
- sales-oriented content
- template-specific footer sections
- placeholder company names
- unrelated product claims

Replace them with RepoMind-specific terminology and actions.

Examples:

"Take a Demo"
→ "Explore RepoMind"

"Get Started"
→ "Analyze Repository"

"Book a Demo"
→ remove

"Contact Sales"
→ remove

"View Pricing"
→ remove

The product should feel like an actual developer application.

==================================================
3. LANDING PAGE
==================================================

Make the landing page clearly communicate what RepoMind AI does.

Hero:

RepoMind AI

UNDERSTAND ANY REPOSITORY.

Supporting text:

Recover architecture, explore dependencies, understand code relationships, and discover repository intelligence with an AI-powered developer analysis platform.

Primary CTA:

Analyze GitHub Repository

Secondary CTA:

Explore Demo

The primary CTA should visually dominate.

Include a GitHub repository URL input:

[ https://github.com/owner/repository ]

[ Analyze Repository ]

Make the input and CTA look like the beginning of the actual product workflow.

Do not make the landing page feel like a generic corporate website.

==================================================
4. PRODUCT CAPABILITIES
==================================================

Keep and visually showcase the existing RepoMind capabilities:

Architecture Recovery
Knowledge Graph
Code Intelligence
Dependency Intelligence
Security Intelligence
Bug Prediction
Documentation Intelligence
AI Developer Assistant
Change Impact Analysis
Architecture Drift
Multi-Repository Intelligence
Repository Discovery
Repository Comparison
Metrics
Agent Intelligence

These are product capabilities.

They should feel like parts of ONE integrated platform.

==================================================
5. MAIN PRODUCT NAVIGATION
==================================================

Create a consistent product navigation system.

Primary navigation:

Overview
Analyze
Architecture
Graph
Code

Additional intelligence modules can remain accessible through the existing navigation or product module menu.

Future modules MUST remain in the design:

Security
AI Assistant
Impact Analysis
Architecture Drift
Discovery
Metrics
Agents
Bug Prediction
Documentation
Recommendations
Multi-Repository Intelligence
Repository Comparison

Do not remove them.

==================================================
6. REPOSITORY ANALYSIS FLOW
==================================================

The visual product flow should be extremely clear:

Landing
    ↓
GitHub Repository URL
    ↓
Analyze Repository
    ↓
Analysis Progress
    ↓
Repository Workspace
    ↓
Architecture / Graph / Code Intelligence

Create a polished analysis state.

Example stages:

Preparing Repository
Scanning Repository Structure
Recovering Architecture
Analyzing Dependencies
Building Knowledge Graph
Generating Repository Intelligence

Use elegant progress indicators.

Do NOT show meaningless fake percentages everywhere.

Use progress stages rather than excessive numerical detail.

==================================================
7. REPOSITORY WORKSPACE
==================================================

The Repository Workspace should be the main application screen.

It should contain:

Repository identity
Repository metadata
Repository metrics
Repository tree
Architecture overview
Graph access
Code intelligence access

Suggested hierarchy:

TOP:

Repository name
Owner / repository path
Description
Branch
Languages
Stars / forks where available

Then:

Repository Intelligence

Metrics

Architecture

Dependencies

Knowledge Graph

Code Intelligence

Make the workspace spacious and organized.

Do not turn every section into a separate giant card.

==================================================
8. REPOSITORY TREE
==================================================

Design the repository tree like a professional IDE explorer.

Example:

REPOSITORY

src/
  components/
  services/
  utils/
  App.tsx
  main.tsx

backend/
  app/
  services/
  routers/

tests/

Folders should have clear visual distinction from files.

Selected files should have a strong but subtle active state.

Use monospace typography.

Generated files such as:

__pycache__
*.pyc
node_modules
.git
dist
build
coverage

should be visually de-emphasized or hidden by default.

Do not delete their conceptual support from the product.

==================================================
9. FILE INTELLIGENCE
==================================================

Create a clean developer-oriented File Intelligence panel.

Instead of showing huge walls of text, organize information.

Header:

FILE INTELLIGENCE

backend/app.py

Python

Then compact metrics:

IMPORTS
7

CLASSES
0

FUNCTIONS
32

DEPENDENCIES
4

Below:

Overview
Entities
Relationships

Entities should be displayed as structured lists.

FUNCTIONS

get_connection()
get_students()
add_student()
update_student()

CLASSES

ClassName

RELATIONSHIPS

imports
depends_on
contains
used_by

Use scrollable sections for long lists.

The design should resemble a professional code intelligence panel, not a plain text dump.

==================================================
10. ARCHITECTURE VIEW
==================================================

Architecture is one of the HERO FEATURES.

Make the architecture graph large.

Do not squeeze it into a tiny card.

Use a large graph canvas with:

- clear nodes
- clear hierarchy
- sufficient spacing
- subtle edges
- readable labels
- zoom controls
- minimap
- search
- filters

Architecture should communicate:

"How is this repository organized?"

rather than showing every individual function.

Use conceptual groups such as:

Application
Routes
Services
Models
Configuration
Utilities
Tests

Use visual grouping where appropriate.

==================================================
11. KNOWLEDGE GRAPH
==================================================

Knowledge Graph is another HERO FEATURE.

Design it as a large interactive visualization.

Show:

Files
Modules
Classes
Functions
Methods
Relationships

However, avoid making the graph visually chaotic.

Use:

- clear spacing
- subtle relationship lines
- node type indicators
- selected node glow
- focus mode
- search
- zoom
- minimap
- filters

Relationship labels should NOT always be visible.

Show relationship labels primarily when a node or edge is selected/hovered.

==================================================
12. GRAPH INTERACTION DESIGN
==================================================

Design the following controls:

Search
Filter
Zoom In
Zoom Out
Fit View
Reset
Focus Selected
Expand Neighborhood

Create a clear selected-node state.

Selected node:

- brighter border
- subtle glow
- brighter text
- connected edges emphasized

Unrelated nodes:

- visually subdued

This creates a clear focus mode.

==================================================
13. ARCHITECTURE STORY
==================================================

Create a polished Architecture Story panel.

Example structure:

ARCHITECTURE STORY

Entry Points
01

Detected Components
Routes
Services
Models
Configuration

Key Relationships

Routes → Services
Services → Models
Application → Configuration

Evidence

backend/app.py
backend/routes/
backend/services/

The exact values can remain mock data in the design.

==================================================
14. SECURITY MODULE
==================================================

KEEP the Security module.

It may continue showing mock/demo security findings.

Design it professionally:

Security Overview
Risk Summary
Findings
Affected Files
Severity
Recommendations

Do not remove it simply because the current backend does not implement security analysis yet.

==================================================
15. AI ASSISTANT
==================================================

KEEP the AI Assistant.

Make it feel like a repository-aware developer assistant.

Example UI:

RepoMind AI Assistant

"Ask anything about this repository..."

Suggested questions:

How is authentication implemented?
Which modules depend on the database?
Where is the main entry point?
What files are most connected?
What would be affected if I modify this module?

Use mock responses for now.

==================================================
16. IMPACT ANALYSIS
==================================================

KEEP Impact Analysis.

Create a visual flow such as:

Selected File
      ↓
Direct Dependencies
      ↓
Affected Modules
      ↓
Potential Impact

Use mock/demo data.

==================================================
17. ARCHITECTURE DRIFT
==================================================

KEEP Architecture Drift.

Use a professional visualization showing:

Expected Architecture
vs
Current Architecture

Possible sections:

Drift Summary
Changed Components
Unexpected Dependencies
Architecture Violations

Mock data is acceptable.

==================================================
18. DISCOVERY
==================================================

KEEP Repository Discovery.

Show a polished interface for discovering repositories.

Include:

Search
Repository cards
Language
Stars
Architecture
Activity
Complexity

Keep demo/mock data for now.

==================================================
19. METRICS
==================================================

KEEP Metrics.

Design professional repository analytics:

Files
Modules
Functions
Classes
Dependencies
Relationships
Complexity
Architecture Coverage

Use clean charts and metric cards.

Avoid huge oversized numbers.

==================================================
20. AGENT SYSTEM
==================================================

KEEP the "9 Agents" concept.

Present it as RepoMind's specialized intelligence layer.

Example:

Repository Analyzer
Architecture Agent
Dependency Agent
Security Agent
Bug Risk Agent
Documentation Agent
Impact Agent
Drift Agent
AI Assistant

Show:

Agent status
Purpose
Current task
Result

This remains mock/demo data for now.

==================================================
21. BUG PREDICTION
==================================================

KEEP Bug Prediction.

Design:

Bug Risk Overview
High Risk Files
Risk Factors
Potential Issues
Affected Modules

Use mock data.

==================================================
22. DOCUMENTATION INTELLIGENCE
==================================================

KEEP Documentation Intelligence.

Design:

Documentation Coverage
Missing Documentation
Outdated Documentation
Suggested Documentation
Module Documentation

Use mock data.

==================================================
23. FUTURE-READY DESIGN
==================================================

All future modules should look like real product features.

Do NOT make them look disabled or unfinished.

They can contain realistic mock/demo information.

The visual system must make it possible to replace mock data with real backend data later without redesigning the screens.

==================================================
24. CONSISTENT COMPONENT SYSTEM
==================================================

Create a consistent visual language for:

Buttons
Inputs
Tabs
Cards
Panels
Badges
Metrics
Graphs
Tables
Lists
Tooltips
Modals
Search
Dropdowns

Use the same spacing and typography system across all pages.

Avoid every page having a different visual style.

==================================================
25. PAGE TRANSITIONS
==================================================

Use subtle transitions between:

Landing
Analyze
Workspace
Architecture
Graph
Code
Security
AI
Impact
Drift
Discovery

Animations should be fast and professional.

Avoid excessive animation.

==================================================
26. RESPONSIVE DESIGN
==================================================

Ensure the designs work at:

1366 × 768
1440 × 900
1920 × 1080

Graphs should have enough space.

Panels should not overlap.

Text should remain readable.

Do not create unnecessary horizontal scrolling.

==================================================
27. FINAL DESIGN CHECK
==================================================

Before finishing, review EVERY page.

Ask:

Does this look like RepoMind AI?

Does this look like a developer intelligence platform?

Does the user immediately understand what the product does?

Is the primary action obvious?

Are graphs readable?

Are technical details organized?

Does the navigation make sense?

Does the entire application feel like ONE product?

Remove anything that looks like leftover Figma template content.

==================================================
IMPORTANT
==================================================

DO NOT:

- connect backend
- write API code
- remove mock data
- remove future modules
- redesign the entire concept
- add generic SaaS sections
- add pricing
- add sales/contact sections
- remove Security
- remove AI Assistant
- remove Impact Analysis
- remove Architecture Drift
- remove Discovery
- remove Metrics
- remove Agents
- remove Bug Prediction
- remove Documentation

This phase is ONLY:

POLISH THE FIGMA FRONTEND AND FINALIZE THE PRODUCT DESIGN.

The final Figma should be a complete RepoMind AI product design that can later be exported to React and connected to the existing FastAPI backend.