import Image from "next/image";

type GameImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function GameImage({ src, alt, className, priority }: GameImageProps) {
  if (!src) {
    return (
      <div className={className ?? ""}>
        <div className="flex h-full min-h-40 items-center justify-center bg-surface text-sm text-slate-400">No image</div>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />;
}
