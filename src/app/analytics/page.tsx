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

function AnalyticsPageContent() {
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="container px-4 py-6">
            <h1 className="text-3xl font-bold">Sales Analytics</h1>
            <p className="text-blue-100 mt-1">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container px-4 py-6">
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-blue-100 mt-1">
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
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${data.summary.totalSales.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.totalOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Paid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.summary.paidOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Unpaid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.summary.unpaidOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${data.summary.averageOrderValue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-sm text-gray-600 w-20">
                      {item.date}
                    </div>
                    <div className="flex-1">
                      <div
                        className="bg-green-500 h-8 rounded flex items-center px-2 text-white text-sm font-medium"
                        style={{
                          width: `${
                            (item.sales /
                              Math.max(...data.chartData.map((d) => d.sales))) *
                            100
                          }%`,
                          minWidth: "60px",
                        }}
                      >
                        ${item.sales.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-sm text-gray-600 w-20">
                      {item.date}
                    </div>
                    <div className="flex-1">
                      <div
                        className="bg-blue-500 h-8 rounded flex items-center px-2 text-white text-sm font-medium"
                        style={{
                          width: `${
                            (item.orders /
                              Math.max(
                                ...data.chartData.map((d) => d.orders)
                              )) *
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
                    <div className="bg-orange-100 text-orange-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">
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

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["COUNTER"]}>
      <AnalyticsPageContent />
    </RoleGuard>
  );
}
