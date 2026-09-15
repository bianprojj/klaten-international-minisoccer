"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useEffect, useState } from "react";
import Image from "next/image";
import { siteContent } from "@/lib/mock-data";

function isValidRemoteImageUrl(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function AdminContentEditor() {
  const [content, setContent] = useState(siteContent);
  const [message, setMessage] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState("");
  const [uploadedPreviewError, setUploadedPreviewError] = useState(false);

  const previewFallback =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 320'%3E%3Crect width='480' height='320' fill='%23152536'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='24' fill='%23ffffff'%3EPreview not available%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    void fetch("/api/admin/site-content", { cache: "no-store" })
      .then(async (response) => { const t = await response.text(); try { return JSON.parse(t); } catch { return {}; } })
      .then((result) => {
        if (result.success) setContent({ ...siteContent, ...result.data });
      })
      .catch(() => setContent(siteContent));
  }, []);

  useEffect(() => {
    setUploadedPreviewError(false);
  }, [uploadUrl]);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const backgroundUrlIsValid = !content.backgroundImageUrl || isValidRemoteImageUrl(content.backgroundImageUrl);

  const updateField = (key: keyof typeof siteContent, value: string) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (content.backgroundImageUrl && !backgroundUrlIsValid) {
      setMessage("Invalid hero background URL. Use a full https:// image URL or upload a file.");
      return;
    }
    try {
      const { res: response, data: __body } = await fetchJson("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(String(result.message ?? "") || "Unable to save content.");
      setContent({ ...siteContent, ...result.data });
      setMessage("Content saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save content.");
    }
  };

  const uploadImage = async () => {
    setUploadStatus("Uploading...");
    try {
      const { res: response, data: __body } = await fetchJson("/api/cloudinary/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: content.backgroundImageUrl }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(String(result.message ?? "") || "Upload failed");
      }

      setUploadUrl(result.data.secure_url ?? "");
      setContent((current) => ({ ...current, backgroundImageUrl: result.data.secure_url ?? current.backgroundImageUrl }));
      setUploadStatus("Upload successful.");
    } catch (error) {
      setUploadStatus((error as Error).message || "Upload failed.");
    } finally {
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setUploadStatus("Please choose a file first.");
      return;
    }

    setUploadStatus("Uploading file...");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { res: response, data: __body } = await fetchJson("/api/cloudinary/upload-file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(String(result.message ?? "") || "Upload failed");
      }

      const secureUrl = result.data.secure_url ?? "";
      setUploadUrl(secureUrl);
      setContent((current) => ({ ...current, backgroundImageUrl: secureUrl }));
      setUploadStatus("File upload successful.");
      setSelectedFile(null);
    } catch (error) {
      setUploadStatus((error as Error).message || "Upload failed.");
    } finally {
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  const selectDroppedImage = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (file && file.type.startsWith("image/")) setSelectedFile(file);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
    <section className="glass-panel rounded-2xl p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Content editor</p>
        <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)]">Change hero text and images</h2>
      </div>
      <div className="grid gap-5">
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero title</span>
          <input
            value={content.heroTitle}
            onChange={(event) => updateField("heroTitle", event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
          />
        </label>
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero subtitle</span>
          <textarea
            value={content.heroSubtitle}
            onChange={(event) => updateField("heroSubtitle", event.target.value)}
            className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none min-h-[96px]"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Primary CTA text</span>
            <input
              value={content.ctaPrimary}
              onChange={(event) => updateField("ctaPrimary", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Secondary CTA text</span>
            <input
              value={content.ctaSecondary}
              onChange={(event) => updateField("ctaSecondary", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
        </div>
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero background image URL</span>
          <input
            value={content.backgroundImageUrl}
            onChange={(event) => updateField("backgroundImageUrl", event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
          />
          {!backgroundUrlIsValid ? (
            <p className="mt-2 text-sm text-amber-300">Invalid hero background URL. Use a full https:// image URL or upload a file.</p>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={uploadImage}
              className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.08)]"
            >
              Upload hero image from URL
            </button>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={selectDroppedImage}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-[color:rgba(16,185,129,0.28)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.08)]"
            >
              <span>Drag & drop hero image or select file</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={uploadFile}
              disabled={!selectedFile}
              className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload selected file
            </button>
          </div>
          {selectedFile ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">Selected file: {selectedFile.name}</p>
          ) : null}
          {selectedFilePreview ? (
            <div className="mt-3 max-w-[240px] overflow-hidden rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)]">
              <Image src={selectedFilePreview} alt="Selected preview" width={240} height={192} unoptimized className="h-48 w-full object-cover" />
            </div>
          ) : null}
          {uploadUrl ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-[color:var(--muted)]">Uploaded URL:</p>
              <a href={uploadUrl} className="text-sm text-[color:var(--accent)] break-all" target="_blank" rel="noreferrer">
                {uploadUrl}
              </a>
              <div className="mt-2 max-w-[240px] overflow-hidden rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)]">
                <Image
                  src={uploadedPreviewError ? previewFallback : uploadUrl}
                  alt="Uploaded preview"
                  width={240}
                  height={192}
                  unoptimized
                  className="h-48 w-full object-cover"
                  onError={() => setUploadedPreviewError(true)}
                />
              </div>
              {uploadedPreviewError ? (
                <div className="mt-3 rounded-3xl border-2 border-dashed border-[color:var(--accent)] bg-[color:rgba(16,185,129,0.28)] px-4 py-4 text-sm text-[color:var(--foreground)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent-strong)] text-black">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <circle cx="8" cy="10" r="1.5" fill="currentColor" />
                        <path d="M4 17L9.5 11.5L13 15L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">Preview unavailable</p>
                      <p className="text-sm text-[color:var(--muted)]">The uploaded image could not be displayed.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {uploadStatus ? <p className="mt-2 text-sm text-[color:var(--accent)]">{uploadStatus}</p> : null}
          {content.backgroundImageUrl && backgroundUrlIsValid ? (
            <div className="mt-3 overflow-hidden rounded-3xl border border-white/10">
              <Image src={content.backgroundImageUrl} alt="Hero background preview" width={600} height={300} unoptimized className="h-48 w-full object-cover" />
              <p className="px-3 py-2 text-xs text-[color:var(--muted)]">Hero background preview</p>
            </div>
          ) : null}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Contact email</span>
            <input
              value={content.contactEmail}
              onChange={(event) => updateField("contactEmail", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Contact phone</span>
            <input
              value={content.contactPhone}
              onChange={(event) => updateField("contactPhone", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
        </div>
        <button type="button" onClick={save} disabled={!backgroundUrlIsValid} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          Save website content
        </button>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </div>
    </section>
    </div>
  );
}
