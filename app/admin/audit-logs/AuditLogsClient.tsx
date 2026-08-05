"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: unknown;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  } | null;
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get("/api/admin/audit-logs", {
          params: {
            page,
            limit: 20,
            search: search.trim() || undefined,
          },
        });

        setLogs(response.data.logs || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("FETCH_AUDIT_LOGS_ERROR", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchLogs, 300);

    return () => clearTimeout(timeout);
  }, [page, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pt-60">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
      >
        <FaArrowLeft className="text-xs" />
        Back to Admin
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Security activity history for admin actions and critical events.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
        <FaSearch className="text-sm text-neutral-400" />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by user ID, name, email, action, or target ID..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="align-top hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 font-semibold">{log.action}</td>

                        <td className="px-4 py-3 text-neutral-600">
                          <div>{log.targetType}</div>
                          <div className="text-xs text-neutral-400">
                            {log.targetId || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-neutral-600">
                          <div>{log.user?.name || "Unknown"}</div>
                          <div className="text-xs text-neutral-400">
                            {log.user?.email || "-"}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {log.user?.role || "-"}
                          </div>
                        </td>

                        <td className="max-w-md px-4 py-3">
                          <pre className="max-h-32 overflow-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <button
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}