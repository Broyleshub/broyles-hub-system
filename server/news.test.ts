import { describe, expect, it, beforeEach, vi } from "vitest";
import { newsRouter } from "./news";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  listNewsArticles: vi.fn(),
  getNewsArticleById: vi.fn(),
  filterNewsByCategory: vi.fn(),
  filterNewsByFacility: vi.fn(),
  filterNewsByDateRange: vi.fn(),
  markNewsAsReviewed: vi.fn(),
  deleteNewsArticle: vi.fn(),
  upsertNewsArticle: vi.fn(),
  getIncidentTrendCounts: vi.fn(),
  getBreakdownByFacility: vi.fn(),
  getCategoryDistribution: vi.fn(),
  getPopulationChartData: vi.fn(),
  getAggregationStats: vi.fn(),
}));

// Mock user context
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("News Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("news.list", () => {
    it("should list news articles with default parameters", async () => {
      const mockArticles = [
        {
          id: 1,
          title: "Test Article",
          source: "Test Source",
          url: "https://example.com/1",
          publishedAt: new Date(),
          category: "incident" as const,
          facilityTags: JSON.stringify(["EKCC"]),
          summary: "Test summary",
          status: "new" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        },
      ];

      vi.mocked(db.listNewsArticles).mockResolvedValue(mockArticles);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.list({});

      expect(result).toEqual(mockArticles);
      expect(db.listNewsArticles).toHaveBeenCalledWith(20, 0, undefined);
    });

    it("should filter by status", async () => {
      const mockArticles = [];
      vi.mocked(db.listNewsArticles).mockResolvedValue(mockArticles);

      const caller = newsRouter.createCaller({} as any);
      await caller.list({ status: "reviewed" });

      expect(db.listNewsArticles).toHaveBeenCalledWith(20, 0, "reviewed");
    });

    it("should filter by category", async () => {
      const mockArticles = [];
      vi.mocked(db.filterNewsByCategory).mockResolvedValue(mockArticles);

      const caller = newsRouter.createCaller({} as any);
      await caller.list({ category: "incident" });

      expect(db.filterNewsByCategory).toHaveBeenCalledWith("incident", 20, 0);
    });

    it("should filter by facility", async () => {
      const mockArticles = [];
      vi.mocked(db.filterNewsByFacility).mockResolvedValue(mockArticles);

      const caller = newsRouter.createCaller({} as any);
      await caller.list({ facility: "EKCC" });

      expect(db.filterNewsByFacility).toHaveBeenCalledWith("EKCC", 20, 0);
    });

    it("should filter by date range", async () => {
      const mockArticles = [];
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      vi.mocked(db.filterNewsByDateRange).mockResolvedValue(mockArticles);

      const caller = newsRouter.createCaller({} as any);
      await caller.list({ startDate, endDate });

      expect(db.filterNewsByDateRange).toHaveBeenCalledWith(startDate, endDate, 20, 0);
    });
  });

  describe("news.getById", () => {
    it("should get a news article by ID", async () => {
      const mockArticle = {
        id: 1,
        title: "Test Article",
        source: "Test Source",
        url: "https://example.com/1",
        publishedAt: new Date(),
        category: "incident" as const,
        facilityTags: JSON.stringify(["EKCC"]),
        summary: "Test summary",
        status: "new" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      };

      vi.mocked(db.getNewsArticleById).mockResolvedValue(mockArticle);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.getById({ id: 1 });

      expect(result).toEqual(mockArticle);
      expect(db.getNewsArticleById).toHaveBeenCalledWith(1);
    });

    it("should return undefined if article not found", async () => {
      vi.mocked(db.getNewsArticleById).mockResolvedValue(undefined);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.getById({ id: 999 });

      expect(result).toBeUndefined();
    });
  });

  describe("news.markAsReviewed", () => {
    it("should mark an article as reviewed", async () => {
      vi.mocked(db.markNewsAsReviewed).mockResolvedValue(undefined);

      const ctx = createMockContext();
      const caller = newsRouter.createCaller(ctx as any);
      const result = await caller.markAsReviewed({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.markNewsAsReviewed).toHaveBeenCalledWith(1, ctx.user.id);
    });
  });

  describe("news.delete", () => {
    it("should delete an article", async () => {
      vi.mocked(db.deleteNewsArticle).mockResolvedValue(undefined);

      const caller = newsRouter.createCaller(createMockContext() as any);
      const result = await caller.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.deleteNewsArticle).toHaveBeenCalledWith(1);
    });
  });

  describe("news.upsert", () => {
    it("should upsert a news article", async () => {
      vi.mocked(db.upsertNewsArticle).mockResolvedValue(undefined);

      const caller = newsRouter.createCaller(createMockContext() as any);
      const result = await caller.upsert({
        title: "New Article",
        source: "Test Source",
        url: "https://example.com/new",
        publishedAt: new Date(),
        category: "incident",
        facilityTags: JSON.stringify(["EKCC"]),
        summary: "New article summary",
      });

      expect(result).toEqual({ success: true });
      expect(db.upsertNewsArticle).toHaveBeenCalled();
    });
  });

  describe("Analytics Procedures", () => {
    it("should get incident trend counts", async () => {
      const mockTrends = [
        { date: "2024-06-20", count: 5, category: "incident" },
        { date: "2024-06-21", count: 3, category: "incident" },
      ];

      vi.mocked(db.getIncidentTrendCounts).mockResolvedValue(mockTrends);

      const caller = newsRouter.createCaller({} as any);
      const startDate = new Date("2024-06-20");
      const endDate = new Date("2024-06-21");
      const result = await caller.incidentTrendCounts({ startDate, endDate });

      expect(result).toEqual(mockTrends);
      expect(db.getIncidentTrendCounts).toHaveBeenCalledWith(startDate, endDate);
    });

    it("should get breakdown by facility", async () => {
      const mockBreakdown = [
        { facility: "EKCC", count: 10 },
        { facility: "Northpoint", count: 8 },
      ];

      vi.mocked(db.getBreakdownByFacility).mockResolvedValue(mockBreakdown);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.breakdownByFacility();

      expect(result).toEqual(mockBreakdown);
      expect(db.getBreakdownByFacility).toHaveBeenCalled();
    });

    it("should get category distribution", async () => {
      const mockDistribution = [
        { category: "incident", count: 15 },
        { category: "policy", count: 8 },
      ];

      vi.mocked(db.getCategoryDistribution).mockResolvedValue(mockDistribution);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.categoryDistribution();

      expect(result).toEqual(mockDistribution);
      expect(db.getCategoryDistribution).toHaveBeenCalled();
    });

    it("should get population chart data", async () => {
      const mockData = [
        { date: "2024-06-20", count: 5 },
        { date: "2024-06-21", count: 3 },
      ];

      vi.mocked(db.getPopulationChartData).mockResolvedValue(mockData);

      const caller = newsRouter.createCaller({} as any);
      const startDate = new Date("2024-06-20");
      const endDate = new Date("2024-06-21");
      const result = await caller.populationChartData({ startDate, endDate });

      expect(result).toEqual(mockData);
      expect(db.getPopulationChartData).toHaveBeenCalledWith(startDate, endDate);
    });

    it("should get aggregation stats", async () => {
      const mockStats = {
        totalArticles: 50,
        newArticles: 5,
        facilitiesCovered: 8,
      };

      vi.mocked(db.getAggregationStats).mockResolvedValue(mockStats);

      const caller = newsRouter.createCaller({} as any);
      const result = await caller.stats();

      expect(result).toEqual(mockStats);
      expect(db.getAggregationStats).toHaveBeenCalled();
    });
  });
});
