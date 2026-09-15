"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Field } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { formatJakartaDate, getTodayDateStringInTimeZone } from "@/lib/timezone";

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price?: number;
};

function getTodayIso() {
  return getTodayDateStringInTimeZone();
}

function parseTimeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  return Number.isNaN(hour) || Number.isNaN(minute) ? NaN : hour * 60 + minute;
}

function getDurationHours(startTime: string, endTime: string) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  return Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);
}

function getSelectedRange(slots: AvailabilitySlot[]) {
  if (slots.length === 0) {
    return null;
  }

  const sorted = [...slots].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  const startTime = sorted[0].startTime;
  const endTime = sorted[sorted.length - 1].endTime;
  const isContinuous = sorted.every((slot, index) => {
    if (index === 0) return true;
    return slot.startTime === sorted[index - 1].endTime;
  });

  return { startTime, endTime, isContinuous };
}

export function BookingForm({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const selectedField = fields[0];
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !selectedField?.id) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSlots([]);
    setSelectedSlots([]);

    fetch(`/api/fields/${selectedField.id}/availability?date=${selectedDate}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Unable to load schedule.");
        }

        return response.json();
      })
        .then((data) => {
          if (!data?.success || !Array.isArray(data.schedules)) {
            throw new Error("Schedule data is malformed.");
          }

          const raw = data.schedules as unknown as Array<Record<string, unknown>>;
          const normalized = raw.map((s) => ({
            id: String(s.id),
            startTime: String(s.startTime),
            endTime: String(s.endTime),
            isAvailable: Boolean(s.isAvailable),
            price: typeof s.price === "number" ? (s.price as number) : undefined,
          }));

          setSlots(normalized);
        })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setError((error as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [selectedField?.id, selectedDate]);

  const selectedIds = useMemo(() => new Set(selectedSlots.map((slot) => slot.id)), [selectedSlots]);
  const selectedRange = useMemo(() => getSelectedRange(selectedSlots), [selectedSlots]);
  const selectedDuration = selectedRange ? getDurationHours(selectedRange.startTime, selectedRange.endTime) : 0;
  const selectedAmount = selectedSlots.length > 0 ? selectedSlots.reduce((sum, s) => sum + (s.price ?? 0), 0) : 0;

  const selectedLabel = selectedRange
    ? `${selectedRange.startTime} - ${selectedRange.endTime}`
    : "Not selected";

  const handleSlotToggle = (slot: AvailabilitySlot) => {
    if (!slot.isAvailable) return;

    setSelectedSlots((current) => {
      const isSelected = current.some((selected) => selected.id === slot.id);
      if (isSelected) {
        return current.filter((selected) => selected.id !== slot.id);
      }
      return [...current, slot];
    });
  };

  const handleContinue = async () => {
    if (!selectedRange) {
      setSubmitError("Please choose at least one slot before continuing.");
      return;
    }

    if (!selectedRange.isContinuous) {
      setSubmitError("Please select a continuous range of slots without gaps.");
      return;
    }

    if (!selectedField) {
      setSubmitError("Select a field first.");
      return;
    }

    setSubmitError(null);

    const query = new URLSearchParams({
      fieldName: selectedField.name,
      bookingDate: selectedDate,
      startTime: selectedRange.startTime,
      endTime: selectedRange.endTime,
      amount: selectedAmount.toString(),
    }).toString();

    setValidating(true);
    try {
      const resp = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: selectedDate,
          startTime: selectedRange.startTime,
          endTime: selectedRange.endTime,
          validateOnly: true,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.success) {
        setSubmitError(data?.message || "Unable to validate booking.");
        setValidating(false);
        return;
      }
    } catch {
      setSubmitError("Unable to validate booking. Please try again.");
      setValidating(false);
      return;
    } finally {
      setValidating(false);
    }

    router.push(`/checkout?${query}`);
  };

  return (
    <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] p-6 shadow-[0_4px_16px_rgba(26,31,77,0.08)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[Manrope] text-xs font-semibold text-[#005136]">Book a field</p>
          <h2 className="mt-2 text-balance font-[Archivo] text-2xl font-extrabold leading-tight tracking-[-0.015em] text-[#1A1F4D] sm:text-[32px]">Reserve your preferred slot</h2>
        </div>
        <div>
          <p className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Choose a field and date, then confirm the available schedule.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#F1EED9] p-6">
          <p className="font-[Manrope] text-sm font-medium text-[rgba(26,31,77,0.62)]">Field</p>
          <p className="mt-2 font-[Archivo] text-base font-bold text-[#1A1F4D]">{selectedField?.name}</p>
          <p className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">{selectedField?.location}</p>
        </div>
        <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#F1EED9] p-6">
          <label className="block font-[Manrope] text-sm font-medium text-[rgba(26,31,77,0.62)]">Booking date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-2 w-full rounded-[12px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] px-4 py-3 font-[Manrope] text-[#1A1F4D] outline-none focus:border-[#005136]"
          />
          <p className="mt-2 font-[Manrope] text-xs text-[rgba(26,31,77,0.62)]">Display: {selectedDate ? formatJakartaDate(selectedDate) : "—"} (DD-MM-YYYY)</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-[Archivo] text-lg font-bold text-[#1A1F4D]">Available time slots</h3>
            <p className="mt-1 font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Only one customer can reserve a slot at a time.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] p-6 font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Loading availability…</div>
          ) : error ? (
            <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/5 p-6 font-[Manrope] text-sm text-rose-700">{error}</div>
          ) : slots.length === 0 ? (
            <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] p-6 font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">No schedule available for this field on the selected date.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => {
                const label = `${slot.startTime} - ${slot.endTime}`;
                const isSelected = selectedIds.has(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSlotToggle(slot)}
                    className={`rounded-[12px] border px-4 py-4 text-left font-[Manrope] transition-all duration-200 overflow-hidden min-w-0 ${
                      slot.isAvailable
                        ? isSelected
                          ? "border-none bg-[#C9D651] text-[#1A1F4D] shadow-[0_4px_14px_rgba(201,214,81,0.35)]"
                          : "border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] text-[#1A1F4D] hover:border-[#005136]"
                        : "border-none bg-[#F1EED9]/60 text-[rgba(26,31,77,0.62)] cursor-not-allowed"
                    }`}
                    disabled={!slot.isAvailable}
                    >
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-sm font-semibold">{typeof slot.price === "number" && slot.price > 0 ? formatCurrency(slot.price) : "—"}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm opacity-70">
                          {slot.isAvailable ? "Available" : "Booked"}
                        </p>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            slot.isAvailable
                              ? isSelected
                                ? "bg-[#1A1F4D]/10 text-[#1A1F4D]"
                                : "bg-[#C9D651] text-[#005136]"
                              : "bg-transparent border border-[rgba(0,81,54,0.16)] text-[rgba(26,31,77,0.62)]"
                          }`}
                        >
                          {slot.isAvailable ? "Open" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#F1EED9] p-6">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div>
            <p className="font-[Manrope] text-xs font-semibold text-[#005136]">Booking preview</p>
            <p className="mt-2 font-[Archivo] text-lg font-bold text-[#1A1F4D]">{selectedField?.name}</p>
            <p className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">{selectedField?.location}</p>
          </div>
          <div className="rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] p-4">
            <div className="grid gap-3">
              <div>
                <p className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Duration</p>
                <p className="font-[Archivo] text-lg font-bold text-[#1A1F4D]">{selectedRange ? `${selectedDuration} hour(s)` : "Select a slot"}</p>
              </div>
              <div>
                <p className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Date & time</p>
                <p className="mt-1 font-[Manrope] text-[#1A1F4D]">{selectedDate ? formatJakartaDate(selectedDate) : "—"} • {selectedLabel}</p>
              </div>
              {selectedRange && !selectedRange.isContinuous ? (
                <p className="font-[Manrope] text-sm text-amber-700">Select continuous slots without gaps.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(0,81,54,0.16)] pt-4 text-[#1A1F4D] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-[Manrope] text-sm text-[rgba(26,31,77,0.62)]">Estimated total</span>
          <span className="font-[Archivo] text-2xl font-extrabold">{formatCurrency(selectedAmount)}</span>
        </div>

        {submitError ? (
          <p className="mt-4 rounded-[20px] border border-rose-500/20 bg-rose-500/10 p-4 font-[Manrope] text-sm text-rose-700">{submitError}</p>
        ) : null}

        <button
          type="button"
          onClick={handleContinue}
          disabled={validating}
          aria-busy={validating}
          aria-label={validating ? "Checking availability" : "Continue to checkout"}
          className="btn-primary mt-6 w-full px-6 py-4 text-base disabled:opacity-60"
        >
          <span className={`flex items-center justify-center transform transition-opacity transition-transform duration-200 ease-in-out ${validating ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
            <svg className="h-5 w-5 animate-spin text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="sr-only">Checking availability</span>
          </span>
          <span className={`transform transition-opacity transition-transform duration-200 ease-in-out ${validating ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}>
            Continue to checkout
          </span>
        </button>
      </div>
    </div>
  );
}
