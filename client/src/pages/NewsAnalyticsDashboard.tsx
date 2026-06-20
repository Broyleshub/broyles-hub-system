import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import PopulationChart from "@/components/PopulationChart";
import CategoryChart from "@/components/CategoryChart";
import FacilityChart from "@/components/FacilityChart";

export default function NewsAnalyticsDashboard() {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"new" | "reviewed" | "archived" | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch news articles
  const { data: articles, isLoading: articlesLoading } = trpc.news.list.useQuery({
    limit,
    offset,
    status: statusFilter,
    category: categoryFilter,
  });

  // Fetch analytics stats
  const { data: stats, isLoading: statsLoading } = trpc.news.stats.useQuery();

  // Fetch population chart data
  const { data: populationData, isLoading: populationLoading } = trpc.news.populationChartData.useQuery({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // Fetch category distribution
  const { data: categoryData, isLoading: categoryLoading } = trpc.news.categoryDistribution.useQuery();

  // Fetch facility breakdown
  const { data: facilityData, isLoading: facilityLoading } = trpc.news.breakdownByFacility.useQuery();

  // Filter articles by search query
  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!searchQuery) return articles;
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      incident: "bg-red-900 text-red-100",
      policy: "bg-blue-900 text-blue-100",
      staffing: "bg-yellow-900 text-yellow-100",
      reform: "bg-green-900 text-green-100",
      memorial: "bg-purple-900 text-purple-100",
      legal: "bg-orange-900 text-orange-100",
      other: "bg-gray-700 text-gray-100",
    };
    return colors[category] || colors.other;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-yellow-900 text-yellow-100",
      reviewed: "bg-green-900 text-green-100",
      archived: "bg-gray-700 text-gray-100",
    };
    return colors[status] || colors.other;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">DOC News Analytics</h1>
        <p className="text-gray-400 mt-2">Track and analyze Department of Corrections news and incidents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <div className="text-3xl font-bold text-white">{stats?.totalArticles || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">New Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <div className="text-3xl font-bold text-yellow-400">{stats?.newArticles || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">Facilities Covered</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <div className="text-3xl font-bold text-blue-400">{stats?.facilitiesCovered || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Incident Trends (90 Days)</CardTitle>
            <CardDescription className="text-gray-400">Articles published over time</CardDescription>
          </CardHeader>
          <CardContent>
            {populationLoading ? (
              <div className="flex justify-center items-center h-80">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <PopulationChart data={populationData || []} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Category Distribution</CardTitle>
            <CardDescription className="text-gray-400">Articles by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex justify-center items-center h-80">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <CategoryChart data={categoryData || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Facility Breakdown</CardTitle>
          <CardDescription className="text-gray-400">Articles by facility</CardDescription>
        </CardHeader>
        <CardContent>
          {facilityLoading ? (
            <div className="flex justify-center items-center h-80">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <FacilityChart data={facilityData || []} />
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">News Feed</CardTitle>
          <CardDescription className="text-gray-400">Filter and search articles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Select value={statusFilter || ""} onValueChange={(v) => setStatusFilter((v as "new" | "reviewed" | "archived") || undefined)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter || ""} onValueChange={(v) => setCategoryFilter(v || undefined)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="staffing">Staffing</SelectItem>
                <SelectItem value="reform">Reform</SelectItem>
                <SelectItem value="memorial">Memorial</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Articles ({filteredArticles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {articlesLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No articles found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Title</TableHead>
                    <TableHead className="text-gray-300">Source</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Published</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white font-medium">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 underline"
                        >
                          {article.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-gray-400">{article.source}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(article.category)}>
                          {article.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {format(new Date(article.publishedAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(article.status)}>
                          {article.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Previous
            </Button>
            <span className="text-gray-400">Page {Math.floor(offset / limit) + 1}</span>
            <Button
              onClick={() => setOffset(offset + limit)}
              disabled={!articles || articles.length < limit}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
