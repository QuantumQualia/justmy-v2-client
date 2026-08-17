"use client";

import {
  Bookmark,
  Copy,
  Download,
  Heart,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { openShare } from "@/components/common/share/share-store";
import { NewsAccountAvatar } from "@/components/news/asksky/news-account-avatar";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { ApiClientError } from "@/lib/api-client";
import {
  deleteSkyConversation,
  fetchSkyConversation,
  fetchSkyConversations,
  renameSkyConversation,
  type SkyMeConversationDetail,
  type SkyMeConversationListItem,
} from "@/lib/news/fetch-sky-conversations";
import type { ProfileFavoriteItem } from "@/lib/news/fetch-profile-favorites";
import { authService } from "@/lib/services/auth";
import { useNewsFavoritesStore } from "@/lib/store/news-favorites-store";
import { cn } from "@workspace/ui/lib/utils";

const PREVIEW_COUNT = 3;

type NewsAccountUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  avatarUrl?: string | null;
};

type NewsAccountSidebarProps = {
  open: boolean;
  onClose: () => void;
  market: NewsMarketContext;
  user: NewsAccountUser;
  photoUrl?: string | null;
  isVerified?: boolean;
  onNewChat: () => void;
  onOpenConversation: (detail: SkyMeConversationDetail) => void;
  activeConversationId: number | null;
  onConversationDeleted: (id: number) => void;
  onSignedOut: () => void;
  refreshKey?: number;
};

function displayName(user: NewsAccountUser): string {
  const full = [user.firstName, user.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ");
  if (full) return full;
  return user.email?.split("@")[0]?.trim() || "Account";
}

function appMycardUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/${slug}`;
}

function conversationTitle(item: SkyMeConversationListItem): string {
  const title = item.title?.trim();
  return title || "Untitled search";
}

function transcriptFromMessages(
  messages: Array<{ role: string; content: string }>,
): string {
  return messages
    .map((m) => {
      const who = m.role === "assistant" ? "AskSKY" : "You";
      return `${who}: ${m.content.trim()}`;
    })
    .filter((line) => line.length > 5)
    .join("\n\n");
}

export function NewsAccountSidebar({
  open,
  onClose,
  market,
  user,
  photoUrl,
  isVerified = false,
  onNewChat,
  onOpenConversation,
  activeConversationId,
  onConversationDeleted,
  onSignedOut,
  refreshKey = 0,
}: NewsAccountSidebarProps) {
  const [recents, setRecents] = useState<SkyMeConversationListItem[]>([]);
  const favorites = useNewsFavoritesStore((s) => s.items);
  const hydrateFavorites = useNewsFavoritesStore((s) => s.hydrate);
  const resetFavorites = useNewsFavoritesStore((s) => s.reset);
  const [showAllRecents, setShowAllRecents] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const renameLockRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = displayName(user);
  const zip = market.zipcode.trim().slice(0, 5);
  const avatarSrc = photoUrl?.trim() || user.avatarUrl?.trim() || "";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchSkyConversations(market.marketId)
      .then((items) => {
        if (!cancelled) setRecents(items);
      })
      .catch(() => {
        if (!cancelled) setRecents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, market.marketId, refreshKey]);

  useEffect(() => {
    if (!open) return;
    void hydrateFavorites();
  }, [open, hydrateFavorites]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (renamingId != null) {
      renameLockRef.current = false;
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (menuOpenId == null) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpenId(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpenId(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenId]);

  useEffect(() => {
    if (!open) {
      setMenuOpenId(null);
      setRenamingId(null);
      setShowAllRecents(false);
      setShowAllFavorites(false);
    }
  }, [open]);

  const visibleRecents = showAllRecents ? recents : recents.slice(0, PREVIEW_COUNT);
  const visibleFavorites = showAllFavorites
    ? favorites
    : favorites.slice(0, PREVIEW_COUNT);

  async function handleNewChat() {
    onNewChat();
    onClose();
  }

  async function handleOpenRecent(id: number) {
    try {
      const detail = await fetchSkyConversation(id);
      onOpenConversation(detail);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Unable to open that search.",
      );
    }
  }

  async function commitRename(id: number) {
    if (renameLockRef.current) return;
    renameLockRef.current = true;
    const title = renameValue.trim();
    const previous = recents.find((item) => item.id === id);
    setRenamingId(null);
    setMenuOpenId(null);
    if (!title || (previous && conversationTitle(previous) === title)) {
      renameLockRef.current = false;
      return;
    }
    setRecents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item)),
    );
    try {
      const updated = await renameSkyConversation(id, title);
      setRecents((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
    } catch (err) {
      if (previous) {
        setRecents((prev) =>
          prev.map((item) => (item.id === id ? previous : item)),
        );
      }
      toast.error(
        err instanceof ApiClientError ? err.message : "Unable to rename.",
      );
    } finally {
      renameLockRef.current = false;
    }
  }

  function cancelRename() {
    renameLockRef.current = true;
    setRenamingId(null);
    setMenuOpenId(null);
    queueMicrotask(() => {
      renameLockRef.current = false;
    });
  }

  async function handleCopy(id: number) {
    try {
      const detail = await fetchSkyConversation(id);
      const text = transcriptFromMessages(detail.messages);
      await navigator.clipboard.writeText(text || conversationTitle(
        recents.find((r) => r.id === id) ?? {
          id,
          title: null,
          updatedAt: "",
          createdAt: "",
        },
      ));
      toast.success("Copied to clipboard");
      setMenuOpenId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Unable to copy.",
      );
    }
  }

  async function handleShare(id: number) {
    try {
      const detail = await fetchSkyConversation(id);
      const text = transcriptFromMessages(detail.messages);
      const title = detail.title?.trim() || "AskSKY search";
      await openShare({
        title,
        description: text.slice(0, 500) || title,
        url: typeof window !== "undefined" ? window.location.href : "",
        entityLabel: "AskSKY",
      });
      setMenuOpenId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Unable to share.",
      );
    }
  }

  async function handleExport(id: number) {
    try {
      const detail = await fetchSkyConversation(id);
      const text = transcriptFromMessages(detail.messages);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = (detail.title || "asksky-search")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      a.href = href;
      a.download = `${slug || "asksky-search"}.txt`;
      a.click();
      URL.revokeObjectURL(href);
      setMenuOpenId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Unable to export.",
      );
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this search from your account?")) return;
    try {
      await deleteSkyConversation(id);
      setRecents((prev) => prev.filter((item) => item.id !== id));
      onConversationDeleted(id);
      setMenuOpenId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Unable to delete.",
      );
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authService.logout();
      resetFavorites();
      onSignedOut();
      onClose();
    } catch {
      toast.error("Unable to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  function comingSoon(label: string) {
    toast.message(`${label} is coming soon.`);
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-60 bg-slate-900/30 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed top-0 right-0 z-70 flex h-full w-[min(22rem,100vw)] flex-col border-l border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        aria-label="Account"
      >
        <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4">
          <NewsAccountAvatar photoUrl={avatarSrc} label={name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {zip ? `${zip} resident` : "Resident"}
              {isVerified ? (
                <span className="text-violet-600"> · Verified</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close account menu"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <button
            type="button"
            onClick={() => void handleNewChat()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New AskSKY! search
          </button>

          <section className="mt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Recents
            </h2>
            {recents.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Your AskSKY searches will show up here.
              </p>
            ) : (
              <ul className="mt-2 space-y-0.5">
                {visibleRecents.map((item) => (
                  <li key={item.id} className="relative">
                    {renamingId === item.id ? (
                      <form
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void commitRename(item.id);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 shrink-0 text-violet-500" />
                        <input
                          ref={renameRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => void commitRename(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void commitRename(item.id);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          className="h-8 min-w-0 flex-1 rounded-lg border border-violet-200 bg-white px-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-200"
                          maxLength={120}
                          aria-label="Rename search"
                        />
                      </form>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-xl pr-1 transition",
                          activeConversationId === item.id
                            ? "bg-violet-50"
                            : "hover:bg-slate-50",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => void handleOpenRecent(item.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                        >
                          <MessageCircle className="h-4 w-4 shrink-0 text-violet-500" />
                          <span className="truncate text-sm text-slate-800">
                            {conversationTitle(item)}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                          aria-label="Conversation actions"
                          aria-expanded={menuOpenId === item.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId((cur) =>
                              cur === item.id ? null : item.id,
                            );
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {menuOpenId === item.id ? (
                      <div
                        ref={menuRef}
                        role="menu"
                        className="absolute right-2 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
                      >
                        <RecentMenuItem
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          label="Rename"
                          onClick={() => {
                            setRenameValue(conversationTitle(item));
                            setRenamingId(item.id);
                            setMenuOpenId(null);
                          }}
                        />
                        <RecentMenuItem
                          icon={<Copy className="h-3.5 w-3.5" />}
                          label="Copy"
                          onClick={() => void handleCopy(item.id)}
                        />
                        <RecentMenuItem
                          icon={<Share2 className="h-3.5 w-3.5" />}
                          label="Share"
                          onClick={() => void handleShare(item.id)}
                        />
                        <RecentMenuItem
                          icon={<Download className="h-3.5 w-3.5" />}
                          label="Export"
                          onClick={() => void handleExport(item.id)}
                        />
                        <RecentMenuItem
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          label="Delete"
                          danger
                          onClick={() => void handleDelete(item.id)}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {recents.length > PREVIEW_COUNT ? (
              <button
                type="button"
                className="mt-1 px-2 text-xs font-semibold text-violet-600 hover:text-violet-500"
                onClick={() => setShowAllRecents((v) => !v)}
              >
                {showAllRecents ? "Show less" : "Show more"}
              </button>
            ) : null}
          </section>

          <section className="mt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Liked & Bookmarked
            </h2>
            {favorites.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Heart or bookmark a business card to save it here.
              </p>
            ) : (
              <ul className="mt-2 space-y-0.5">
                {visibleFavorites.map((item) => {
                  const href = item.slug ? appMycardUrl(item.slug) : "";
                  return (
                    <li key={item.profileId}>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                        >
                          <FavoriteThumb item={item} />
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                            {item.name}
                          </span>
                          {item.liked ? (
                            <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-500 text-rose-500" />
                          ) : null}
                          {item.bookmarked ? (
                            <Bookmark className="h-3.5 w-3.5 shrink-0 fill-violet-500 text-violet-500" />
                          ) : null}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl px-2 py-2">
                          <FavoriteThumb item={item} />
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                            {item.name}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {favorites.length > PREVIEW_COUNT ? (
              <button
                type="button"
                className="mt-1 px-2 text-xs font-semibold text-violet-600 hover:text-violet-500"
                onClick={() => setShowAllFavorites((v) => !v)}
              >
                {showAllFavorites ? "Show less" : "Show more"}
              </button>
            ) : null}
          </section>

          <section className="mt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              myAPPS
            </h2>
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={() => comingSoon("Night-out planner")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Night-out planner
              </button>
              <button
                type="button"
                onClick={() => comingSoon("Sky FM vault")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Sky FM vault
              </button>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function RecentMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-violet-50 hover:text-violet-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FavoriteThumb({ item }: { item: ProfileFavoriteItem }) {
  const initial = (item.name.trim() || "B").slice(0, 1).toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600">
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
