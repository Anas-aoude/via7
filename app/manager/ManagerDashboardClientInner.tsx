"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Range = "1m" | "3m" | "6m" | "1y" | "all";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

interface ListingItem {
  id: string;
  title: string;
  governorate: string;
  category: string;
  purpose: string;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface AnalyticsUserItem {
  id: string;
  role: string;
  createdAt: string;
}

interface AnalyticsListingItem {
  id: string;
  governorate: string;
  category: string;
  purpose: string;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface TopListingItem {
  id: string;
  title: string;
  governorate: string;
  city: string | null;
  viewCount?: number;
  favoriteCount?: number;
  imageUrl: string | null;
  imageUrls: string[];
}

interface ManagerDashboardClientProps {
  usersCount: number;
  listingsCount: number;
  featuredCount: number;
  activeListingsCount: number;
  reviewsCount: number;
  users: UserItem[];
  listings: ListingItem[];
  analyticsUsers: AnalyticsUserItem[];
  analyticsListings: AnalyticsListingItem[];
  topViewedListings: TopListingItem[];
  topFavoritedListings: TopListingItem[];
}

const ranges: { label: string; value: Range; days?: number }[] = [
  { label: "1 Month", value: "1m", days: 30 },
  { label: "3 Months", value: "3m", days: 90 },
  { label: "6 Months", value: "6m", days: 180 },
  { label: "1 Year", value: "1y", days: 365 },
  { label: "All", value: "all" },
];

const COLORS = ["#f43f5e", "#0f172a", "#3b82f6", "#22c55e", "#f59e0b"];

function filterByRange<T extends { createdAt: string }>(
  items: T[],
  range: Range
) {
  const selectedRange = ranges.find((item) => item.value === range);

  if (!selectedRange?.days) {
    return items;
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - selectedRange.days);
  fromDate.setHours(0, 0, 0, 0);

  return items.filter((item) => new Date(item.createdAt) >= fromDate);
}

function groupByCount<T>(
  items: T[],
  getKey: (item: T) => string,
  limit?: number
) {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item) || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });

  const result = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return limit ? result.slice(0, limit) : result;
}

function getCumulativeData<
  TUser extends { createdAt: string },
  TListing extends { createdAt: string }
>(users: TUser[], listings: TListing[]) {
  const map = new Map<
    string,
    {
      date: string;
      users: number;
      listings: number;
    }
  >();

  users.forEach((user) => {
    const date = user.createdAt.slice(0, 10);
    const existing = map.get(date) || { date, users: 0, listings: 0 };

    existing.users += 1;
    map.set(date, existing);
  });

  listings.forEach((listing) => {
    const date = listing.createdAt.slice(0, 10);
    const existing = map.get(date) || { date, users: 0, listings: 0 };

    existing.listings += 1;
    map.set(date, existing);
  });

  let totalUsers = 0;
  let totalListings = 0;

  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => {
      totalUsers += item.users;
      totalListings += item.listings;

      return {
        date: item.date,
        label: item.date.slice(5),
        users: totalUsers,
        listings: totalListings,
      };
    });
}

function ChartFilter({
  value,
  onChange,
}: {
  value: Range;
  onChange: (value: Range) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            value === range.value
              ? "bg-rose-500 text-white border-rose-500"
              : "bg-white text-neutral-600 border-neutral-200 hover:border-rose-500"
            }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

function ChartBox({
  title,
  range,
  setRange,
  children,
}: {
  title: string;
  range: Range;
  setRange: (value: Range) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-2xl p-6 shadow-sm bg-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <ChartFilter value={range} onChange={setRange} />
      </div>

      <div className="h-[320px]">{children}</div>
    </div>
  );
}

function TopListingsBox({
  title,
  items,
  metric,
}: {
  title: string;
  items: TopListingItem[];
  metric: "views" | "favorites";
}) {
  return (
    <div className="border rounded-2xl p-6 shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-6">{title}</h2>

      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const image =
            item.imageUrl || item.imageUrls?.[0] || "/images/placeholder.jpg";

          const value =
            metric === "views" ? item.viewCount || 0 : item.favoriteCount || 0;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b last:border-b-0 pb-4 last:pb-0"
            >
              <div className="text-lg font-bold text-neutral-400 w-8">
                #{index + 1}
              </div>

              <img
                src={image}
                alt={item.title}
                className="w-16 h-12 rounded-lg object-cover bg-neutral-100"
              />

              <div className="flex-1 min-w-0">
                <a
                  href={`/listings/${item.id}`}
                  className="font-semibold hover:underline line-clamp-1"
                >
                  {item.title}
                </a>

                <div className="text-xs text-neutral-500">
                  {item.governorate}
                  {item.city ? `, ${item.city}` : ""}
                </div>
              </div>

              <div className="font-bold">{value}</div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-neutral-500 text-sm">No listings found.</div>
        )}
      </div>
    </div>
  );
}

const ManagerDashboardClientInner: React.FC<ManagerDashboardClientProps> = ({
  usersCount,
  listingsCount,
  featuredCount,
  activeListingsCount,
  reviewsCount,
  users,
  listings,
  analyticsUsers,
  analyticsListings,
  topViewedListings,
  topFavoritedListings,
}) => {
  const router = useRouter();

  const [usersGrowthRange, setUsersGrowthRange] = useState<Range>("1m");
  const [listingsGrowthRange, setListingsGrowthRange] = useState<Range>("1m");
  const [governorateRange, setGovernorateRange] = useState<Range>("all");
  const [categoryRange, setCategoryRange] = useState<Range>("all");
  const [purposeRange, setPurposeRange] = useState<Range>("all");
  const [statusRange, setStatusRange] = useState<Range>("all");
  const [featuredRange, setFeaturedRange] = useState<Range>("all");
  const [hostsRange, setHostsRange] = useState<Range>("all");

  const usersGrowthData = useMemo(() => {
    return getCumulativeData(
      filterByRange(analyticsUsers, usersGrowthRange),
      []
    );
  }, [analyticsUsers, usersGrowthRange]);

  const listingsGrowthData = useMemo(() => {
    return getCumulativeData(
      [],
      filterByRange(analyticsListings, listingsGrowthRange)
    );
  }, [analyticsListings, listingsGrowthRange]);

  const governorateData = useMemo(
    () =>
      groupByCount(
        filterByRange(analyticsListings, governorateRange),
        (listing) => listing.governorate,
        12
      ),
    [analyticsListings, governorateRange]
  );

  const categoryData = useMemo(
    () =>
      groupByCount(
        filterByRange(analyticsListings, categoryRange),
        (listing) => listing.category,
        10
      ),
    [analyticsListings, categoryRange]
  );

  const purposeData = useMemo(
    () =>
      groupByCount(
        filterByRange(analyticsListings, purposeRange),
        (listing) => listing.purpose || "Unknown"
      ),
    [analyticsListings, purposeRange]
  );

  const statusData = useMemo(() => {
    const filtered = filterByRange(analyticsListings, statusRange);

    return [
      {
        name: "Active",
        count: filtered.filter((listing) => listing.isActive).length,
      },
      {
        name: "Inactive",
        count: filtered.filter((listing) => !listing.isActive).length,
      },
    ];
  }, [analyticsListings, statusRange]);

  const featuredData = useMemo(() => {
    const filtered = filterByRange(analyticsListings, featuredRange);

    return [
      {
        name: "Featured",
        count: filtered.filter((listing) => listing.featured).length,
      },
      {
        name: "Normal",
        count: filtered.filter((listing) => !listing.featured).length,
      },
    ];
  }, [analyticsListings, featuredRange]);

  const topHostsData = useMemo(() => {
    const filtered = filterByRange(analyticsListings, hostsRange);

    return groupByCount(
      filtered,
      (listing) => listing.user.name || listing.user.email || listing.userId,
      10
    );
  }, [analyticsListings, hostsRange]);

  const roleData = useMemo(() => {
    return groupByCount(analyticsUsers, (user) => user.role);
  }, [analyticsUsers]);

  const cards = [
    { label: "Users", value: usersCount, href: "/manager/users" },
    { label: "Listings", value: listingsCount, href: "/manager/listings" },
    { label: "Reviews", value: reviewsCount, href: "/manager/reviews" },
    {
      label: "Featured Listings",
      value: featuredCount,
      href: "/manager/listings?featured=true",
    },
    {
      label: "Active Listings",
      value: activeListingsCount,
      href: "/manager/listings?active=true",
    },
  ];

  return (
    <>
      <h1 className="text-4xl font-bold mb-10">Manager Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className="border rounded-2xl p-6 shadow-sm text-left hover:shadow-md hover:-translate-y-1 transition bg-white"
          >
            <div className="text-neutral-500 mb-2">{card.label}</div>
            <div className="text-4xl font-bold">{card.value}</div>
          </button>
        ))}
      </div>

      <div className="border rounded-2xl p-6 shadow-sm bg-white mb-10">
        <h2 className="text-xl font-bold mb-6">Users by Role</h2>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f43f5e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        <TopListingsBox
          title="Top 10 Most Viewed Listings"
          items={topViewedListings}
          metric="views"
        />

        <TopListingsBox
          title="Top 10 Most Favorited Listings"
          items={topFavoritedListings}
          metric="favorites"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ChartBox
          title="Users Growth"
          range={usersGrowthRange}
          setRange={setUsersGrowthRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usersGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line dataKey="users" stroke="#f43f5e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Listings Growth"
          range={listingsGrowthRange}
          setRange={setListingsGrowthRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={listingsGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area dataKey="listings" stroke="#f43f5e" fill="#ffe4e6" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Listings by Governorate"
          range={governorateRange}
          setRange={setGovernorateRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={governorateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#f43f5e" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Listings by Category"
          range={categoryRange}
          setRange={setCategoryRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f43f5e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Rent vs Sale"
          range={purposeRange}
          setRange={setPurposeRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie
                data={purposeData}
                dataKey="count"
                nameKey="name"
                outerRadius={110}
                label
              >
                {purposeData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Active vs Inactive"
          range={statusRange}
          setRange={setStatusRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                innerRadius={65}
                outerRadius={110}
                label
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Featured vs Normal"
          range={featuredRange}
          setRange={setFeaturedRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie
                data={featuredData}
                dataKey="count"
                nameKey="name"
                innerRadius={65}
                outerRadius={110}
                label
              >
                {featuredData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title="Top 10 Hosts"
          range={hostsRange}
          setRange={setHostsRange}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topHostsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#f43f5e" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </>
  );
};

export default ManagerDashboardClientInner;