/** Small round avatar for the drivers table - reflects whatever photo the
 * driver has set on their own profile in the mobile app, since it's the
 * same underlying record the admin is reading here. */
export function DriverAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- data: URIs, not a Next-optimizable remote image
    return <img src={imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-grad text-xs font-bold text-white">
      {initial}
    </div>
  );
}
