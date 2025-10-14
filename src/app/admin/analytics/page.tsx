"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  ShoppingBag,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsData {
  summary: {
    totalSales: number;
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
    averageOrderValue: number;
  };
  chartData: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  period: string;
}

function AdminAnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  const { toast } = useToast();

  const fetchAnalytics = useCallback(
    async (selectedPeriod: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?period=${selectedPeriod}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load analytics",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
          <div className="container px-4 py-6">
            <h1 className="text-3xl font-bold">Sales Analytics (Admin)</h1>
            <p className="text-purple-100 mt-1">
              Track your restaurant performance
            </p>
          </div>
        </div>

        <div className="container px-4 py-6">
          <Tabs value={period} className="mb-6">
            <TabsList>
              <TabsTrigger value="daily">Today</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="yearly">This Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-10">
        <div className="text-center">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-6">
          <h1 className="text-3xl font-bold">Sales Analytics (Admin)</h1>
          <p className="text-purple-100 mt-1">
            Track your restaurant performance
          </p>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Period Selector */}
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as "daily" | "monthly" | "yearly")}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="yearly">This Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-600">
                  ${data.summary.totalSales.toFixed(2)}
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">
                  {data.summary.totalOrders}
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Paid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  {data.summary.paidOrders}
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unpaid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-orange-600">
                  {data.summary.unpaidOrders}
                </div>
                <XCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-indigo-600">
                  ${data.summary.averageOrderValue.toFixed(2)}
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.chartData.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.date}</span>
                      <span className="text-sm font-bold text-purple-600">
                        ${item.sales.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (item.sales / Math.max(...data.chartData.map((d) => d.sales))) *
                            100
                          }%`,
                          minWidth: "20px",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.chartData.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.date}</span>
                      <div
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                        style={{
                          width: `${
                            (item.orders /
                              Math.max(...data.chartData.map((d) => d.orders))) *
                            100
                          }%`,
                          minWidth: "40px",
                        }}
                      >
                        {item.orders}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${item.revenue.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminAnalyticsContent />
    </RoleGuard>
  );
}