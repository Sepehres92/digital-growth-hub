import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  detectSocialFromSite,
  analyzeSocialProfile,
  getTikTokSelf,
  getTwitchUser,
} from "@/lib/social.functions";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social Crawler — Vektra" },
      {
        name: "description",
        content:
          "Detect social profiles from any site, crawl public profiles, and pull live TikTok and Twitch metrics.",
      },
    ],
  }),
  component: SocialPage,
});

type Tab = "detect" | "profile" | "tiktok" | "twitch";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  tiktok: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
  youtube: "bg-red-500/10 text-red-400 border-red-500/30",
  facebook: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  linkedin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  twitch: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  github: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
};

function platformBadge(p: string) {
  const cls = PLATFORM_COLORS[p] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-sm ${cls}`}>
      {p}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="border border-border/60 rounded-md p-4 bg-card">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-xl font-display tracking-tighter">{value ?? "—"}</div>
    </div>
  );
}

function SocialPage() {
  const detectFn = useServerFn(detectSocialFromSite);
  const profileFn = useServerFn(analyzeSocialProfile);
  const tiktokFn = useServerFn(getTikTokSelf);
  const twitchFn = useServerFn(getTwitchUser);

  const [tab, setTab] = useState<Tab>("detect");
  const [siteUrl, setSiteUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [twitchLogin, setTwitchLogin] = useState("");

  const detect = useMutation({ mutationFn: () => detectFn({ data: { url: siteUrl } }) });
  const profile = useMutation({ mutationFn: () => profileFn({ data: { url: profileUrl } }) });
  const tiktok = useMutation({ mutationFn: () => tiktokFn({}) });
  const twitch = useMutation({ mutationFn: () => twitchFn({ data: { login: twitchLogin } }) });

  const active =
    tab === "detect" ? detect : tab === "profile" ? profile : tab === "tiktok" ? tiktok : twitch;

  const run = () => {
    if (tab === "tiktok") return tiktok.mutate();
    active.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tighter uppercase">
          Vektra
        </Link>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
          <Link to="/seo-audit" className="text-muted-foreground hover:text-primary">
            SEO Audit
          </Link>
          <Link to="/search-console" className="text-muted-foreground hover:text-primary">
            Search Console
          </Link>
          <Link to="/semrush" className="text-muted-foreground hover:text-primary">
            Semrush
          </Link>
          <span className="text-primary">Social</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            Social Crawler
          </p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-3">
            Analyze any social presence
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Detect linked social profiles from a website, scrape public profiles for bio and
            engagement signals, and pull live metrics from your connected TikTok and Twitch
            accounts.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              ["detect", "Detect from site"],
              ["profile", "Profile crawl"],
              ["tiktok", "My TikTok"],
              ["twitch", "Twitch user"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border rounded-sm transition ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-8 p-4 border border-border/60 rounded-md bg-card">
          {tab === "detect" && (
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Website URL
              </label>
              <input
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
          )}
          {tab === "profile" && (
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Profile URL
              </label>
              <input
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
          )}
          {tab === "twitch" && (
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Twitch login
              </label>
              <input
                value={twitchLogin}
                onChange={(e) => setTwitchLogin(e.target.value)}
                placeholder="twitchdev"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
          )}
          {tab === "tiktok" && (
            <div className="flex-1 min-w-[260px] text-sm text-muted-foreground self-end">
              Pulls the connected TikTok account profile + recent videos.
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={active.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
            >
              {active.isPending ? "Loading…" : "Run"}
            </button>
          </div>
        </div>

        {active.error && (
          <div className="p-4 border border-destructive/40 bg-destructive/10 text-destructive text-sm rounded-md mb-6">
            {(active.error as Error).message}
          </div>
        )}

        {/* Detect from site */}
        {tab === "detect" && detect.data && (
          <section>
            <h2 className="font-display text-2xl tracking-tighter mb-1">
              {detect.data.title || detect.data.source}
            </h2>
            <p className="text-xs text-muted-foreground mb-4 break-all">{detect.data.source}</p>
            {detect.data.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">No social links found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {detect.data.links.map((l) => (
                  <div
                    key={l.url}
                    className="border border-border/60 rounded-md p-4 bg-card flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {platformBadge(l.platform)}
                        <span className="font-bold truncate">@{l.handle}</span>
                      </div>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary break-all"
                      >
                        {l.url}
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        setProfileUrl(l.url);
                        setTab("profile");
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest border border-border px-3 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition shrink-0"
                    >
                      Analyze
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Profile crawl */}
        {tab === "profile" && profile.data && (
          <section className="space-y-6">
            <div className="flex items-start gap-4">
              {profile.data.ogImage && (
                <img
                  src={profile.data.ogImage}
                  alt=""
                  className="w-20 h-20 rounded-md border border-border object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {platformBadge(profile.data.platform)}
                  {profile.data.handle && <span className="font-bold">@{profile.data.handle}</span>}
                </div>
                <h2 className="font-display text-2xl tracking-tighter">
                  {profile.data.title || profile.data.handle || profile.data.url}
                </h2>
                {profile.data.description && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.data.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Followers" value={profile.data.followers} />
              <Stat label="Following" value={profile.data.following} />
              <Stat label="Posts" value={profile.data.posts} />
            </div>

            {profile.data.summary && (
              <div>
                <h3 className="font-display text-lg tracking-tighter mb-2">AI summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.data.summary}
                </p>
              </div>
            )}

            {profile.data.recentTitles.length > 0 && (
              <div>
                <h3 className="font-display text-lg tracking-tighter mb-2">Recent content</h3>
                <ul className="space-y-1 text-sm">
                  {profile.data.recentTitles.map((t, i) => (
                    <li key={i} className="border-l-2 border-primary/40 pl-3 py-1">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* TikTok self */}
        {tab === "tiktok" && tiktok.data && (
          <section className="space-y-6">
            {"error" in (tiktok.data.user as object) ? (
              <p className="text-sm text-destructive">{(tiktok.data.user as { error: string }).error}</p>
            ) : (
              (() => {
                const u = tiktok.data.user as Record<string, any>;
                return (
                  <>
                    <div className="flex items-start gap-4">
                      {u.avatar_url && (
                        <img src={u.avatar_url} alt="" className="w-20 h-20 rounded-full border border-border" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {platformBadge("tiktok")}
                          {u.is_verified && (
                            <span className="text-[10px] font-bold text-primary uppercase">Verified</span>
                          )}
                        </div>
                        <h2 className="font-display text-2xl tracking-tighter">{u.display_name}</h2>
                        {u.bio_description && (
                          <p className="text-sm text-muted-foreground mt-1">{u.bio_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat label="Followers" value={u.follower_count?.toLocaleString()} />
                      <Stat label="Following" value={u.following_count?.toLocaleString()} />
                      <Stat label="Likes" value={u.likes_count?.toLocaleString()} />
                      <Stat label="Videos" value={u.video_count?.toLocaleString()} />
                    </div>
                  </>
                );
              })()
            )}

            {!("error" in (tiktok.data.videos as object)) && (
              <div>
                <h3 className="font-display text-lg tracking-tighter mb-3">Recent videos</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {((tiktok.data.videos as any)?.videos ?? []).map((v: any) => (
                    <a
                      key={v.id}
                      href={v.share_url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-border/60 rounded-md overflow-hidden bg-card hover:border-primary transition"
                    >
                      {v.cover_image_url && (
                        <img src={v.cover_image_url} alt="" className="w-full aspect-[9/16] object-cover" />
                      )}
                      <div className="p-3">
                        <p className="text-sm font-bold line-clamp-2 mb-2">
                          {v.title || v.video_description || "Untitled"}
                        </p>
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{(v.view_count ?? 0).toLocaleString()} views</span>
                          <span>{(v.like_count ?? 0).toLocaleString()} likes</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Twitch */}
        {tab === "twitch" && twitch.data && (
          <section className="space-y-6">
            {!twitch.data.user ? (
              <p className="text-sm text-muted-foreground">User not found.</p>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  {twitch.data.user.profile_image_url && (
                    <img
                      src={twitch.data.user.profile_image_url}
                      alt=""
                      className="w-20 h-20 rounded-full border border-border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {platformBadge("twitch")}
                      <span className="font-bold">@{twitch.data.user.login}</span>
                      {twitch.data.stream && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold uppercase rounded-sm">
                          Live
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl tracking-tighter">
                      {twitch.data.user.display_name}
                    </h2>
                    {twitch.data.user.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {twitch.data.user.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Broadcaster type" value={twitch.data.user.broadcaster_type || "user"} />
                  <Stat label="Account type" value={twitch.data.user.type || "—"} />
                  <Stat label="Game" value={twitch.data.channel?.game_name} />
                  <Stat label="Language" value={twitch.data.channel?.broadcaster_language} />
                </div>
                {twitch.data.stream && (
                  <div className="border border-border/60 rounded-md p-4 bg-card">
                    <h3 className="font-display text-lg tracking-tighter mb-2">Live now</h3>
                    <p className="text-sm font-bold">{twitch.data.stream.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {twitch.data.stream.viewer_count?.toLocaleString()} viewers ·{" "}
                      {twitch.data.stream.game_name}
                    </p>
                  </div>
                )}
                {twitch.data.channel?.title && !twitch.data.stream && (
                  <div className="border border-border/60 rounded-md p-4 bg-card">
                    <h3 className="font-display text-lg tracking-tighter mb-2">Last stream title</h3>
                    <p className="text-sm">{twitch.data.channel.title}</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
