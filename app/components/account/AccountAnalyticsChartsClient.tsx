"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useTranslation from "@/app/hooks/useTranslation";

interface AccountAnalyticsChartsProps {
  viewsChart: {
    date: string;
    views: number;
  }[];
  reviewsChart: {
    month: string;
    reviews: number;
  }[];
  listingsChart: {
    month: string;
    listings: number;
  }[];
  topListingsChart: {
    title: string;
    views: number;
    favorites: number;
  }[];
}

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="border rounded-3xl p-6 bg-white">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="h-[280px]">{children}</div>
    </div>
  );
};

const AccountAnalyticsCharts: React.FC<AccountAnalyticsChartsProps> = ({
  viewsChart,
  reviewsChart,
  listingsChart,
  topListingsChart,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <ChartCard title={t("account.viewsLast30Days")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={viewsChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="views" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("account.reviewsLast6Months")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reviewsChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="reviews" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("account.listingsCreatedLast6Months")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={listingsChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="listings" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("account.topListingsPerformance")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topListingsChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="views" radius={[8, 8, 0, 0]} />
            <Bar dataKey="favorites" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

export default AccountAnalyticsCharts;