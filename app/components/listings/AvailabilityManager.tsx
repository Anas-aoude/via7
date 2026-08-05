"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DateRange, Range } from "react-date-range";
import { toast } from "react-hot-toast";
import {
  FaCalendarCheck,
  FaLock,
  FaUndo,
  FaSave,
  FaUnlock,
} from "react-icons/fa";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface BlockedDate {
  id: string;
  date: string;
}

interface AvailabilityManagerProps {
  listingId: string;
}

const normalizeDateKey = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
};

const getDatesBetween = (startDate: Date, endDate: Date) => {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(normalizeDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const formatDate = (date?: Date) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const todayKey = normalizeDateKey(new Date());

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  listingId,
}) => {
  const [savedBlockedDates, setSavedBlockedDates] = useState<BlockedDate[]>([]);
  const [draftBlockedKeys, setDraftBlockedKeys] = useState<Set<string>>(
    new Set()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dateRange, setDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const savedBlockedKeys = useMemo(
    () =>
      new Set(
        savedBlockedDates.map((item) => normalizeDateKey(new Date(item.date)))
      ),
    [savedBlockedDates]
  );

  const selectedDates = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return [];
    return getDatesBetween(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  const blockedInsideSelection = useMemo(
    () => selectedDates.filter((date) => draftBlockedKeys.has(date)).length,
    [selectedDates, draftBlockedKeys]
  );

  const availableInsideSelection =
    selectedDates.length - blockedInsideSelection;

  const datesToAdd = useMemo(
    () =>
      Array.from(draftBlockedKeys).filter((date) => !savedBlockedKeys.has(date)),
    [draftBlockedKeys, savedBlockedKeys]
  );

  const datesToRemove = useMemo(
    () =>
      Array.from(savedBlockedKeys).filter((date) => !draftBlockedKeys.has(date)),
    [draftBlockedKeys, savedBlockedKeys]
  );

  const hasChanges = datesToAdd.length > 0 || datesToRemove.length > 0;

  useEffect(() => {
    axios
      .get(`/api/listings/${listingId}/blocked-dates`)
      .then((response) => {
        setSavedBlockedDates(response.data);

        const keys = new Set<string>(
          response.data.map((item: BlockedDate) =>
            normalizeDateKey(new Date(item.date))
          )
        );

        setDraftBlockedKeys(keys);
      })
      .catch(() => {
        toast.error("Could not load availability calendar");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [listingId]);

  const onBlockRange = () => {
    if (selectedDates.length === 0) return;

    setDraftBlockedKeys((current) => {
      const next = new Set(current);
      selectedDates.forEach((date) => next.add(date));
      return next;
    });
  };

  const onUnblockRange = () => {
    if (selectedDates.length === 0) return;

    setDraftBlockedKeys((current) => {
      const next = new Set(current);
      selectedDates.forEach((date) => next.delete(date));
      return next;
    });
  };

  const onResetChanges = () => {
    setDraftBlockedKeys(new Set(savedBlockedKeys));
  };

  const onSaveChanges = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      if (datesToAdd.length > 0) {
        await axios.post(`/api/listings/${listingId}/blocked-dates`, {
          dates: datesToAdd,
        });
      }

      if (datesToRemove.length > 0) {
        await axios.delete(`/api/listings/${listingId}/blocked-dates`, {
          data: {
            dates: datesToRemove,
          },
        });
      }

      const updated = Array.from(draftBlockedKeys).map((date) => ({
        id: date,
        date,
      }));

      setSavedBlockedDates(updated);

      toast.success("Availability saved");
    } catch {
      toast.error("Could not save availability");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border bg-white p-6 text-neutral-500">
        Loading availability calendar...
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FaCalendarCheck className="text-rose-500" />
            <h2 className="text-2xl font-bold">Availability Calendar</h2>
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            Select a range, apply changes locally, then save once.
          </p>
        </div>

        <div className="rounded-2xl border bg-neutral-50 px-4 py-3 text-sm">
          <div className="font-semibold text-black">
            {formatDate(dateRange.startDate)} → {formatDate(dateRange.endDate)}
          </div>
          <div className="text-neutral-500">
            {selectedDates.length} day(s) selected
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-neutral-500">Blocked total</div>
          <div className="text-2xl font-bold text-rose-500">
            {draftBlockedKeys.size}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm text-neutral-500">Selected dates</div>
          <div className="text-2xl font-bold text-black">
            {selectedDates.length}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm text-neutral-500">Blocked in selection</div>
          <div className="text-2xl font-bold text-rose-500">
            {blockedInsideSelection}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm text-neutral-500">Pending changes</div>
          <div className="text-2xl font-bold text-black">
            {datesToAdd.length + datesToRemove.length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border p-3">
        <DateRange
          ranges={[dateRange]}
          onChange={(item) => setDateRange(item.selection)}
          minDate={new Date()}
          months={2}
          direction="horizontal"
          showDateDisplay={false}
          rangeColors={["#111827"]}
          dayContentRenderer={(date) => {
            const dateKey = normalizeDateKey(date);
            const isBlocked = draftBlockedKeys.has(dateKey);
            const isToday = dateKey === todayKey;

            return (
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  isBlocked ? "bg-rose-500 text-white" : "",
                  isToday && !isBlocked ? "ring-2 ring-black" : "",
                ].join(" ")}
              >
                {date.getDate()}
              </div>
            );
          }}
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            Blocked
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-black" />
            Selected range
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-black" />
            Today
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isSaving || blockedInsideSelection === 0}
            onClick={onUnblockRange}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-5 py-3 font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaUnlock />
            Unblock range
          </button>

          <button
            type="button"
            disabled={isSaving || availableInsideSelection === 0}
            onClick={onBlockRange}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaLock />
            Block range
          </button>

          <button
            type="button"
            disabled={isSaving || !hasChanges}
            onClick={onResetChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaUndo />
            Reset
          </button>

          <button
            type="button"
            disabled={isSaving || !hasChanges}
            onClick={onSaveChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaSave />
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;