import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  listNewsArticles,
  getNewsArticleById,
  filterNewsByCategory,
  filterNewsByFacility,
  filterNewsByDateRange,
  markNewsAsReviewed,
  deleteNewsArticle,
  upsertNewsArticle,
  getIncidentTrendCounts,
  getBreakdownByFacility,
  getCategoryDistribution,
  getPopulationChartData,
  getAggregationStats,
} from "./db";

const NewsFilterSchema = z.object({
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
  status: z.enum(["new", "reviewed", "archived"]).optional(),
  category: z.string().optional(),
  facility: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const newsRouter = router({
  // ============ News CRUD Procedures ============

  /**
   * List all news articles with optional filtering
   */
  list: publicProcedure
    .input(NewsFilterSchema)
    .query(async ({ input }) => {
      const { limit, offset, status, category, facility, startDate, endDate } = input;

      if (category) {
        return await filterNewsByCategory(category, limit, offset);
      }

      if (facility) {
        return await filterNewsByFacility(facility, limit, offset);
      }

      if (startDate && endDate) {
        return await filterNewsByDateRange(startDate, endDate, limit, offset);
      }

      return await listNewsArticles(limit, offset, status);
    }),

  /**
   * Get a single news article by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await getNewsArticleById(input.id);
    }),

  /**
   * Filter news by category
   */
  filterByCategory: publicProcedure
    .input(
      z.object({
        category: z.string(),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      return await filterNewsByCategory(input.category, input.limit, input.offset);
    }),

  /**
   * Filter news by facility
   */
  filterByFacility: publicProcedure
    .input(
      z.object({
        facility: z.string(),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      return await filterNewsByFacility(input.facility, input.limit, input.offset);
    }),

  /**
   * Filter news by date range
   */
  filterByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      return await filterNewsByDateRange(
        input.startDate,
        input.endDate,
        input.limit,
        input.offset
      );
    }),

  /**
   * Mark a news article as reviewed (protected)
   */
  markAsReviewed: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await markNewsAsReviewed(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Delete a news article (protected)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deleteNewsArticle(input.id);
      return { success: true };
    }),

  /**
   * Upsert a news article (protected - for admin/cron use)
   */
  upsert: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        source: z.string(),
        url: z.string().url(),
        publishedAt: z.coerce.date(),
        category: z.enum(["incident", "policy", "staffing", "reform", "memorial", "legal", "other"]).optional(),
        facilityTags: z.string().optional(), // JSON string
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await upsertNewsArticle({
        title: input.title,
        source: input.source,
        url: input.url,
        publishedAt: input.publishedAt,
        category: input.category || "other",
        facilityTags: input.facilityTags,
        summary: input.summary,
        status: "new",
      });
      return { success: true };
    }),

  // ============ Analytics Procedures ============

  /**
   * Get incident trend counts over time
   */
  incidentTrendCounts: publicProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ input }) => {
      return await getIncidentTrendCounts(input.startDate, input.endDate);
    }),

  /**
   * Get breakdown by facility
   */
  breakdownByFacility: publicProcedure.query(async () => {
    return await getBreakdownByFacility();
  }),

  /**
   * Get category distribution
   */
  categoryDistribution: publicProcedure.query(async () => {
    return await getCategoryDistribution();
  }),

  /**
   * Get population chart data (incident counts over time)
   */
  populationChartData: publicProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getPopulationChartData(input.startDate, input.endDate);
    }),

  /**
   * Get aggregation statistics (total articles, new articles, facilities covered)
   */
  stats: publicProcedure.query(async () => {
    return await getAggregationStats();
  }),
});
