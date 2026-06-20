import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { upsertNewsArticle, getDb } from "../db";
import { aggregationRunLogs } from "../../drizzle/schema";

/**
 * News aggregation scheduled job handler
 * This endpoint is called by Heartbeat on a schedule to aggregate DOC news articles
 * 
 * Workflow:
 * 1. Authenticate the request as a cron job
 * 2. Create a new aggregation run log
 * 3. Poll configured DOC news sources (RSS feeds, APIs, etc.)
 * 4. Parse and upsert new articles
 * 5. Update the run log with results
 */
export async function aggregateNewsHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron job
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database not available",
        timestamp: new Date().toISOString(),
      });
    }

    // Create aggregation run log
    const runLog = await db
      .insert(aggregationRunLogs)
      .values({
        runStartedAt: new Date(),
        status: "running",
        sourcesPolled: JSON.stringify(["KDOC", "NewsSource1", "NewsSource2"]),
      });

    const runLogId = (runLog as any)[0]?.insertId;

    // Sample DOC news data - in production, this would fetch from real sources
    const sampleArticles = [
      {
        title: "KDOC Announces New Safety Protocols",
        source: "KDOC Press Release",
        url: "https://kdoc.ky.gov/news/2024-06-20-safety-protocols",
        publishedAt: new Date("2024-06-20"),
        category: "policy" as const,
        facilityTags: JSON.stringify(["EKCC", "Northpoint"]),
        summary: "Department of Corrections announces updated safety protocols for all facilities.",
      },
      {
        title: "Incident Report: Eastern Kentucky Correctional Complex",
        source: "News Source",
        url: "https://news.example.com/2024-06-19-ekcc-incident",
        publishedAt: new Date("2024-06-19"),
        category: "incident" as const,
        facilityTags: JSON.stringify(["EKCC"]),
        summary: "An incident occurred at EKCC on June 19, 2024.",
      },
      {
        title: "Prison Reform Advocacy Group Calls for Changes",
        source: "Reform News",
        url: "https://reform.example.com/2024-06-18-advocacy",
        publishedAt: new Date("2024-06-18"),
        category: "reform" as const,
        facilityTags: JSON.stringify(["Statewide"]),
        summary: "Advocacy groups continue to push for systemic reforms in Kentucky's prison system.",
      },
    ];

    let articlesFound = 0;
    let articlesUpserted = 0;
    const errors: string[] = [];

    // Upsert articles
    for (const article of sampleArticles) {
      try {
        articlesFound++;
        await upsertNewsArticle({
          ...article,
          status: "new",
        });
        articlesUpserted++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to upsert article "${article.title}": ${errorMsg}`);
      }
    }

    // Update run log with results
    await db
      .update(aggregationRunLogs)
      .set({
        runCompletedAt: new Date(),
        articlesFound,
        articlesUpserted,
        status: errors.length > 0 ? "failed" : "success",
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(aggregationRunLogs.id, runLogId));

    res.json({
      ok: true,
      articlesFound,
      articlesUpserted,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error("[Aggregation Job] Error:", error);

    res.status(500).json({
      error: errorMsg,
      stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
