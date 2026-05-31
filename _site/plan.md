# pedroholanda.org Improvement Plan

## Detailed Implementation Guide for Claude

Goal: transform pedroholanda.org from a resume-style page into a strong
technical authority site for database engineering and DuckDB
development.

Success criteria: - Visitors understand Pedro's impact within 5
seconds - Engineering contributions are clearly visible - Talks and
research build authority visually - Blog content becomes more
discoverable - The site becomes a technical hub for database systems

------------------------------------------------------------------------

# Phase 1 --- High Impact Structural Improvements

## 1. Improve the Hero Section

### Problem

The hero section currently shows: - name - title

But it does not immediately communicate Pedro's impact.

Pedro helped build DuckDB into one of the most widely used analytical
databases with 36k+ GitHub stars and \~28M monthly downloads.

### Implementation

Replace hero content with:

Pedro Holanda\
Principal Engineer @ DuckDB Labs

Early engineer behind DuckDB, one of the most widely used analytical
databases.

36k+ GitHub stars\
28M+ monthly downloads

Links: GitHub \| Blog \| Talks

### Tasks

-   Update hero layout
-   Add impact statement
-   Display DuckDB metrics prominently
-   Add quick links to GitHub, blog, and talks

### Acceptance Criteria

-   Impact is visible without scrolling
-   Metrics are immediately visible
-   Links are clearly accessible

------------------------------------------------------------------------

## 2. Create an "Engineering Contributions" Section

### Problem

Key systems Pedro built are hidden inside job descriptions.

Examples:

-   CSV Reader
-   CSV Sniffer
-   Arrow Integration
-   ART Persistent Storage
-   BIGNUM implementation
-   Python client improvements

These should appear as **signature engineering work**.

### Implementation

Add a new section:

Engineering Contributions

Each item should appear as a card.

Example:

CSV Reader\
Parallel CSV ingestion engine used in DuckDB for high-performance
analytics.

Links: Blog \| Source

### Tasks

-   Extract 5--7 core technical contributions
-   Create card layout
-   Add links to GitHub or blog posts

### Acceptance Criteria

-   Contributions are scannable
-   Each card explains the system in 1--2 sentences

------------------------------------------------------------------------

## 3. Redesign Talks Section

### Problem

Talks are currently plain text, which weakens their credibility impact.

Pedro has spoken at strong conferences such as:

-   EuroPython
-   FOSDEM
-   DuckCon

These should appear visually.

### Implementation

Create talk cards containing:

-   Talk title
-   Conference name
-   Thumbnail or logo
-   Video link
-   Slides link

Example:

DuckDB: Analytical SQL in Python\
EuroPython 2023

\[Thumbnail\]

Watch Video \| Slides

### Tasks

-   Collect talk thumbnails
-   Add video and slides links
-   Convert talk list into card layout

### Acceptance Criteria

-   Talks appear visually engaging
-   Videos can be accessed easily

------------------------------------------------------------------------

## 4. Improve Blog Section

### Problem

Blog posts are listed but lack summaries.

Topics include:

-   Arrow IPC support
-   CSV performance
-   CSV vs Parquet
-   Ethereum scanning

These are valuable technical articles but not highlighted well.

### Implementation

Convert blog entries into cards.

Each card should include:

-   Title
-   Short summary
-   Year
-   Tags

Example:

CSV vs Parquet: Dethroning the Ultimate Storage Format?

A benchmark exploring when CSV can outperform Parquet in analytical
workloads.

2024\
Tags: Performance, Benchmarking

### Tasks

-   Write 1-sentence summary for each article
-   Add card layout
-   Add topic tags

### Acceptance Criteria

-   Blog posts are easy to scan
-   Summaries improve click-through

------------------------------------------------------------------------

# Phase 2 --- Authority and Storytelling

## 5. Add Career Narrative

### Problem

Career history currently reads like a resume.

### Implementation

Add a short narrative explaining Pedro's work.

Example:

I helped build DuckDB from an academic research prototype at CWI into
one of the most widely adopted analytical databases.

Along the way I worked on core systems including CSV ingestion, Arrow
interoperability, persistent indexing, and large integer support.

### Tasks

-   Add narrative section near the biography
-   Keep it short (3--5 sentences)

### Acceptance Criteria

-   Career story is easy to understand
-   Readers see progression from research to engineering

------------------------------------------------------------------------

## 6. Improve Publications Section

### Problem

Papers are listed like an academic bibliography.

Many engineers do not know what venues like VLDB or ICDE represent.

### Implementation

Add a short description for each publication.

Example:

Progressive Indexes (VLDB)

Introduces indexing structures that adapt dynamically during query
execution to improve interactive analytics.

### Tasks

-   Add 1 sentence summary per paper

### Acceptance Criteria

-   Non-academic readers understand research contributions

------------------------------------------------------------------------

## 7. Expand Projects Section

### Problem

Projects such as DuckDB, DuckLake, and Scrooge McDuck are not deeply
explained.

### Implementation

Convert projects into cards.

Each card should include:

-   Project name
-   Short description
-   GitHub link
-   Optional metrics (stars)

Example:

DuckLake

Integrated data lake format and catalog designed to work with DuckDB.

GitHub

### Tasks

-   Expand project descriptions
-   Add GitHub links

### Acceptance Criteria

-   Visitors quickly understand each project

------------------------------------------------------------------------

# Phase 3 --- Structural Improvements

## 8. Add Career Timeline

### Implementation

Create visual timeline:

2017--2021 --- PhD at CWI / Leiden\
2021 --- Microsoft Research internship\
2021--2023 --- COO at DuckDB Labs\
2023--2025 --- Software Engineer\
2025--Present --- Principal Engineer

### Tasks

-   Create timeline UI component

### Acceptance Criteria

-   Career progression is visually clear

------------------------------------------------------------------------

## 9. Improve Site Navigation

### Suggested Navigation

Home\
Engineering\
Talks\
Research\
Blog\
Projects

### Tasks

-   Add top navigation bar
-   Add section anchors

### Acceptance Criteria

-   Visitors can navigate quickly

------------------------------------------------------------------------

## 10. Add "Now" Section

### Implementation

Example:

Now

Working on: - DuckDB core infrastructure - DuckLake

Interested in: - query execution engines - analytical databases -
performance engineering

### Acceptance Criteria

-   Section is easy to update
-   Shows current work focus

------------------------------------------------------------------------

# Phase 4 --- UX and Polish

## 11. Improve Visual Hierarchy

Tasks:

-   Increase section spacing
-   Improve heading sizes
-   Add separators between sections

------------------------------------------------------------------------

## 12. Add Conference Logos

Display logos for:

-   FOSDEM
-   EuroPython
-   DuckCon

This improves credibility quickly.

------------------------------------------------------------------------

## 13. Add Dark Mode

Optional but recommended for developer audiences.

------------------------------------------------------------------------

## 14. Add Topic Tags

Examples:

Databases\
DuckDB\
Query Engines\
Performance Engineering

------------------------------------------------------------------------

# Phase 5 --- Long-Term Improvements

## Engineering Notes Section

Add short technical essays.

Examples:

-   Why CSV parsing is hard
-   Lessons from building DuckDB
-   Benchmarking mistakes in databases
-   Query execution insights

These posts can establish Pedro as a thought leader in database
engineering.

------------------------------------------------------------------------

# Final Goal

The site should communicate clearly:

Pedro Holanda helped build one of the most influential analytical
databases and actively works on database systems, query processing, and
performance engineering.

Visitors should immediately see:

-   engineering impact
-   technical contributions
-   talks and research
-   current work
