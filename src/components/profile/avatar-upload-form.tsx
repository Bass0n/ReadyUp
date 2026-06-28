"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profile/user-avatar";

type AvatarProfile = {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type AvatarUploadFormProps = {
  profile: AvatarProfile;
};

const maxUploadBytes = 5 * 1024 * 1024;
const avatarSize = 320;

async function cropToSquareDataUrl(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read that image."));
      nextImage.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = avatarSize;
    canvas.height = avatarSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare that image.");

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;

    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, avatarSize, avatarSize);
    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function AvatarUploadForm({ profile }: AvatarUploadFormProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const previewProfile = { ...profile, avatarUrl: previewUrl ?? profile.avatarUrl ?? null };

  async function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > maxUploadBytes) {
      toast.error("Please choose an image under 5 MB.");
      return;
    }

    try {
      setPreviewUrl(await cropToSquareDataUrl(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare that image.");
    } finally {
      event.target.value = "";
    }
  }

  function saveAvatar() {
    if (!previewUrl) return;

    startTransition(async () => {
      const response = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: previewUrl })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not update profile picture.");
        return;
      }

      toast.success("Profile picture updated.");
      setPreviewUrl(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-4">
      <UserAvatar profile={previewProfile} size="lg" />
      <div className="grid gap-3">
        <div>
          <h2 className="font-semibold text-white">Profile picture</h2>
          <p className="mt-1 text-sm text-slate-400">Images are cropped to a square automatically.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
            Choose image
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} className="sr-only" />
          </label>
          <button
            type="button"
            disabled={!previewUrl || isPending}
            onClick={saveAvatar}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save picture"}
          </button>
        </div>
      </div>
    </div>
  );
}
