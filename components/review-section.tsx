"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/types";

export function ReviewSection({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const saveReviews = (nextReviews: Review[]) => {
    setReviews(nextReviews);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setStatus("Please fill in your name and comment.");
      return;
    }

    setStatus("Sending review...");

    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: name, rating, comment }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save review");
        return res.json();
      })
      .then((payload) => {
        const createdReview = payload?.review;
        if (!createdReview) {
          throw new Error("Failed to parse review response.");
        }

        const nextReviews = [
          {
            ...createdReview,
            customerName: createdReview.customerName ?? "Guest",
            date: createdReview.date ?? createdReview.createdAt ?? "",
          },
          ...reviews,
        ];
        saveReviews(nextReviews);
        setComment("");
        setStatus("Review submitted successfully.");
      })
      .catch(() => {
        setStatus("Failed to submit review. Please try again.");
      });
  };

  return (
    <section className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-16 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-8 shadow-sm shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Add a review</p>
              <h2 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)] sm:text-4xl">Tell us about your game experience</h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label htmlFor="review-name" className="block text-sm text-[color:var(--muted)]">
                    <span className="mb-2 block">Name</span>
                    <input
                      id="review-name"
                      name="review-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
                      placeholder="Your name"
                    />
                  </label>
                  <label htmlFor="review-rating" className="block text-sm text-[color:var(--muted)]">
                    <span className="mb-2 block">Rating</span>
                    <select
                      id="review-rating"
                      name="review-rating"
                      value={rating}
                      onChange={(event) => setRating(Number(event.target.value))}
                      className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{`${value} stars`}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label htmlFor="review-comment" className="block text-sm text-[color:var(--muted)]">
                  <span className="mb-2 block">Comment</span>
                  <textarea
                    id="review-comment"
                    name="review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-4 text-[color:var(--foreground)] outline-none min-h-[180px]"
                    placeholder="Share your experience at Klaten International Minisoccer"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[color:var(--muted)]">Your review will appear on the homepage after submission.</p>
                  <button type="submit" className="btn-primary">
                    Submit review
                  </button>
                </div>
                {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="rounded-[2rem] border border-white/10 card-surface p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{review.customerName}</p>
                    <p className="text-sm text-[color:var(--muted)]">{review.date}</p>
                  </div>
                    <span className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-3 py-1 text-sm text-[color:var(--accent)]">
                      {review.rating} ★
                    </span>
                </div>
                <p className="mt-4 text-[color:var(--muted)]">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
