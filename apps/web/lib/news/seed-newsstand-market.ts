import { marketDtoToContext } from "@/components/news/asksky/market-context";
import { isValidUsZip } from "@/lib/news/market-routing";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import { useNewsZipStore } from "@/lib/store/news-zip-store";

function newsstandMarketIsSet(): boolean {
  const { zipcode, market } = useNewsZipStore.getState();
  const zip = (zipcode || market?.zipcode || "").trim().slice(0, 5);
  return isValidUsZip(zip) || Boolean(market?.marketId);
}

async function waitForNewsZipHydration(): Promise<void> {
  if (useNewsZipStore.getState().hasHydrated) return;
  if (useNewsZipStore.persist.hasHydrated()) {
    useNewsZipStore.getState().setHasHydrated(true);
    return;
  }

  await new Promise<void>((resolve) => {
    const unsub = useNewsZipStore.persist.onFinishHydration(() => {
      useNewsZipStore.getState().setHasHydrated(true);
      unsub();
      resolve();
    });
    if (useNewsZipStore.persist.hasHydrated()) {
      useNewsZipStore.getState().setHasHydrated(true);
      unsub();
      resolve();
    }
  });
}

/**
 * If the visitor has no newsstand zip/market yet, use the default profile's zip.
 * Called after login (and other auth session persists). Does not overwrite a saved market.
 */
export async function seedNewsstandMarketFromProfileIfUnset(profile?: {
  zipCode?: string | null;
} | null): Promise<void> {
  if (typeof window === "undefined") return;

  await waitForNewsZipHydration();
  if (newsstandMarketIsSet()) return;

  const zip = profile?.zipCode?.trim().slice(0, 5) ?? "";
  if (!isValidUsZip(zip)) return;

  try {
    const primary = await resolveMarketForZip(zip);
    if (newsstandMarketIsSet()) return;
    if (primary) {
      useNewsZipStore.getState().setMarket(marketDtoToContext(primary, zip));
      return;
    }
  } catch {
    /* fall through to zip-only save */
  }

  if (!newsstandMarketIsSet()) {
    useNewsZipStore.getState().setZipcode(zip);
  }
}
