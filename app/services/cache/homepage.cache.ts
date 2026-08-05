import { BaseCache } from "./base.cache";
import type { HomepageSection } from "@/app/actions/listings/getHomepageSections";

export const HomepageCache = new BaseCache<HomepageSection[]>(
  "homepage:sections:v1",
  60 * 5
);