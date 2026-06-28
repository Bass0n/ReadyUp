import clsx from "clsx";
import defaultAvatar from "@/assets/default-avatar.png";

type AvatarProfile = {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type UserAvatarProps = {
  profile?: AvatarProfile | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl"
};

function getName(profile?: AvatarProfile | null) {
  return profile?.displayName || profile?.email || "ReadyUp user";
}

function getAvatarUrl(profile?: AvatarProfile | null) {
  return profile?.avatarUrl?.startsWith("data:image/") ? profile.avatarUrl : defaultAvatar.src;
}

export function UserAvatar({ profile, size = "md", className }: UserAvatarProps) {
  const name = getName(profile);
  const avatarUrl = getAvatarUrl(profile);

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-center font-bold text-white shadow-sm",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrl} alt="" className="h-full w-full object-cover" title={name} />
    </span>
  );
}
