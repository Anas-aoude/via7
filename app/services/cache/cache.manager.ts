import { HomepageCache } from "./homepage.cache";
import { ListingCache } from "./listing.cache";
import { CacheService } from "./cache.service";
import { UserCache } from "./user.cache";

export const CacheManager = {
  /**
   * Homepage
   */
  async invalidateHomepage() {
    await HomepageCache.clear();
  },

  /**
   * Listing
   */
  async invalidateListing(listingId: string) {
    if (!listingId) return;

    await ListingCache.for(listingId).clear();
  },

  /**
   * Search
   */
  async invalidateSearch() {
    await CacheService.delByPattern("search:*");
  },

  /**
   * User
   */
  async invalidateUser(userId: string) {
    if (!userId) return;

    await UserCache.for(userId).clear();
  },

  /**
   * Clear everything
   */
  async invalidateAll() {
    await this.invalidateHomepage();
    await this.invalidateSearch();

    // Listing cache is dynamic, so it will be cleared
    // individually using invalidateListing(listingId)
  },
};