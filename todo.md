# B.R.O.Y.L.E.S. HUB News Analytics Module - TODO

## Database Schema
- [x] Design DOC news articles table
- [x] Design aggregation run logs table
- [x] Generate and apply Drizzle migrations

## tRPC Procedures - News CRUD
- [x] Implement news.list procedure
- [x] Implement news.getById procedure
- [x] Implement news.filterByCategory procedure
- [x] Implement news.filterByFacility procedure
- [x] Implement news.filterByDateRange procedure
- [x] Implement news.markAsReviewed procedure
- [x] Implement news.delete procedure

## tRPC Procedures - Analytics
- [x] Implement analytics.incidentTrendCounts procedure
- [x] Implement analytics.breakdownByFacility procedure
- [x] Implement analytics.categoryDistribution procedure
- [x] Implement analytics.populationChartData procedure

## Heartbeat Scheduled Job
- [x] Design and implement news aggregation job
- [x] Configure DOC news/RSS sources
- [x] Implement article upsert logic
- [x] Add error handling and logging

## Dashboard UI - News Feed & Summary
- [x] Create News Analytics Dashboard page
- [x] Build summary stat cards
- [x] Build filterable news feed table
- [x] Implement category and facility filter controls
- [x] Add date range filter

## Plotly Visualization Components
- [x] Build Population Chart component
- [x] Build Category Distribution pie chart
- [x] Build Facility Breakdown bar chart
- [x] Integrate all charts into dashboard

## Dark, High-Contrast Dashboard Layout
- [x] Configure DashboardLayout with sidebar navigation
- [x] Apply dark theme with high-contrast colors
- [x] Ensure accessibility standards met
- [x] Style consistency with accountability mission

## Testing
- [x] Write Vitest tests for news CRUD procedures
- [x] Write Vitest tests for analytics query helpers
- [x] Run all tests and verify passing (16 tests passed)

## Deployment & Delivery
- [ ] Save checkpoint to GitHub
- [ ] Verify all features working end-to-end
- [ ] Deliver project to user
