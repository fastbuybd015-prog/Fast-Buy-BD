'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Layers,
  Store as StoreIcon,
  PieChart as PieIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { adminApi, type ChartDataPoint } from '@/lib/api/admin';

// Recharts components
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const STORE_SHARES = [
  { name: 'Fast Mart', value: 580000, color: '#15803d' },
  { name: 'Daily Basket', value: 410000, color: '#0284c7' },
  { name: 'Green Valley', value: 255800, color: '#d97706' },
];

const CATEGORY_PERFORMANCE = [
  { category: 'Grocery & Staples', revenue: 520000, orders: 180 },
  { category: 'Dairy & Eggs', revenue: 260000, orders: 95 },
  { category: 'Packaged Foods', revenue: 210000, orders: 60 },
  { category: 'Snacks & Bakery', revenue: 145000, orders: 40 },
  { category: 'Beverages', revenue: 110800, orders: 35 },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [trendData, setTrendData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminApi.getRevenueTrend(days);
        setTrendData(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  return (
    <div className="space-y-8">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Platform Analytics & Intelligence</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Aggregated financial growth, order metrics, merchant distribution, and category performance
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 },
          ].map((d) => (
            <button
              key={d.val}
              type="button"
              onClick={() => setDays(d.val)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                days === d.val ? 'bg-white dark:bg-ink-900 dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Trends Chart */}
      <Card className="border-ink-100 dark:border-ink-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Revenue & Daily Order Volume
              </CardTitle>
              <CardDescription>
                Gross sales in BDT over the past {days} days
              </CardDescription>
            </div>
            <Badge tone="success">
              <TrendingUp className="h-3 w-3" /> +18.4% Month-over-Month
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [
                    `৳${Number(val).toLocaleString()}`,
                    'Gross Revenue',
                  ]}
                />
                <Legend />
                <Area
                  name="Gross Revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#15803d"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown & Store Market Share */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Category Performance Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="border-ink-100 dark:border-ink-800 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Top Categories by Revenue
              </CardTitle>
              <CardDescription>Sales distribution across household food & grocery staples</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CATEGORY_PERFORMANCE} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                    <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={11} width={120} />
                    <Tooltip formatter={(v: unknown) => [`৳${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#0284c7" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Share Pie Chart */}
        <div className="lg:col-span-5">
          <Card className="border-ink-100 dark:border-ink-800 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Merchant Fulfillment Share
              </CardTitle>
              <CardDescription>Revenue split among active verified stores</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={STORE_SHARES}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {STORE_SHARES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`৳${Number(v).toLocaleString()}`, 'Total Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Strip */}
              <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
                {STORE_SHARES.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 font-medium text-ink-700 dark:text-ink-200">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}</span>
                    <span className="font-bold text-ink-900 dark:text-ink-50">৳{(s.value / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
