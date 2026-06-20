import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, docNewsArticles, InsertDocNewsArticle } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ DOC News Articles Queries ============

export async function listNewsArticles(
  limit: number = 20,
  offset: number = 0,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db
      .select()
      .from(docNewsArticles)
      .where(eq(docNewsArticles.status, status as any))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(docNewsArticles.publishedAt));
  }
  return await db
    .select()
    .from(docNewsArticles)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(docNewsArticles.publishedAt));
}

export async function getNewsArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(docNewsArticles)
    .where(eq(docNewsArticles.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function filterNewsByCategory(category: string, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(docNewsArticles)
    .where(eq(docNewsArticles.category, category as any))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(docNewsArticles.publishedAt));
}

export async function filterNewsByFacility(facility: string, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(docNewsArticles)
    .where(like(docNewsArticles.facilityTags, `%${facility}%`))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(docNewsArticles.publishedAt));
}

export async function filterNewsByDateRange(startDate: Date, endDate: Date, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(docNewsArticles)
    .where(
      and(
        gte(docNewsArticles.publishedAt, startDate),
        lte(docNewsArticles.publishedAt, endDate)
      )
    )
    .limit(limit)
    .offset(offset)
    .orderBy(desc(docNewsArticles.publishedAt));
}

export async function markNewsAsReviewed(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(docNewsArticles)
    .set({
      status: "reviewed",
      reviewedAt: new Date(),
      reviewedBy: userId,
    })
    .where(eq(docNewsArticles.id, id));
}

export async function deleteNewsArticle(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(docNewsArticles).where(eq(docNewsArticles.id, id));
}

export async function upsertNewsArticle(article: InsertDocNewsArticle) {
  const db = await getDb();
  if (!db) return;

  if (!article.url) {
    throw new Error("Article URL is required for upsert");
  }

  try {
    await db
      .insert(docNewsArticles)
      .values(article)
      .onDuplicateKeyUpdate({
        set: {
          title: article.title,
          summary: article.summary,
          category: article.category,
          facilityTags: article.facilityTags,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert news article:", error);
    throw error;
  }
}

// ============ Analytics Queries ============

export async function getIncidentTrendCounts(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`
      SELECT 
        DATE(publishedAt) as date,
        COUNT(*) as count,
        category
      FROM doc_news_articles
      WHERE publishedAt >= ${startDate} AND publishedAt <= ${endDate}
      GROUP BY DATE(publishedAt), category
      ORDER BY DATE(publishedAt) ASC
    `
  );

  return result as any[];
}

export async function getBreakdownByFacility() {
  const db = await getDb();
  if (!db) return [];

  const articles = await db.select().from(docNewsArticles);

  // Parse facilityTags JSON and aggregate
  const facilityMap: Record<string, number> = {};
  articles.forEach((article) => {
    if (article.facilityTags) {
      try {
        const facilities = JSON.parse(article.facilityTags) as string[];
        facilities.forEach((facility) => {
          facilityMap[facility] = (facilityMap[facility] || 0) + 1;
        });
      } catch (e) {
        // Skip malformed JSON
      }
    }
  });

  return Object.entries(facilityMap).map(([facility, count]) => ({
    facility,
    count,
  }));
}

export async function getCategoryDistribution() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`
      SELECT 
        category,
        COUNT(*) as count
      FROM doc_news_articles
      GROUP BY category
      ORDER BY count DESC
    `
  );

  return result as any[];
}

export async function getPopulationChartData(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  let query = db.execute(
    sql`
      SELECT 
        DATE(publishedAt) as date,
        COUNT(*) as count
      FROM doc_news_articles
    `
  );

  if (startDate && endDate) {
    query = db.execute(
      sql`
        SELECT 
          DATE(publishedAt) as date,
          COUNT(*) as count
        FROM doc_news_articles
        WHERE publishedAt >= ${startDate} AND publishedAt <= ${endDate}
        GROUP BY DATE(publishedAt)
        ORDER BY DATE(publishedAt) ASC
      `
    );
  } else {
    query = db.execute(
      sql`
        SELECT 
          DATE(publishedAt) as date,
          COUNT(*) as count
        FROM doc_news_articles
        GROUP BY DATE(publishedAt)
        ORDER BY DATE(publishedAt) ASC
      `
    );
  }

  return query as any;
}

export async function getAggregationStats() {
  const db = await getDb();
  if (!db) return null;

  const totalArticles = await db.execute(
    sql`SELECT COUNT(*) as count FROM doc_news_articles`
  );
  const newArticles = await db.execute(
    sql`SELECT COUNT(*) as count FROM doc_news_articles WHERE status = 'new'`
  );
  const facilitiesCovered = await db.execute(
    sql`SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(facilityTags, '$[*]'))) as count FROM doc_news_articles WHERE facilityTags IS NOT NULL`
  );

  return {
    totalArticles: (totalArticles as any)[0]?.count || 0,
    newArticles: (newArticles as any)[0]?.count || 0,
    facilitiesCovered: (facilitiesCovered as any)[0]?.count || 0,
  };
}


