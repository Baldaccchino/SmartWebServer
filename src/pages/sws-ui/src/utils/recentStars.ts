import { API } from "../api/api";
import { Star } from "./stars";
import { clone } from "../utils/compareObjects";

const updateLibraryEndpoint = "mount-ajax-get.txt";
const getLibraryEndpoint = "ajax/library";
let cachedRecents: Star[] = [];

export class RecentStars {
  // use the last catalog in memory
  private catalog = 15;
  private catalogType = "$WebRecents";
  private list: Star[] = cachedRecents;
  private onRefresh?: (list: Star[]) => void;

  constructor(private api: API, onRefresh?: (list: Star[]) => void) {
    this.onRefresh = onRefresh;
  }

  getRecentStars(): Star[] {
    return this.list;
  }

  addStar(star: Star) {
    this.list.push(star);
    return this;
  }

  removeStar(matcher: (star: Star) => boolean) {
    this.list = this.list.filter((star) => !matcher(star));
    return this.storeList();
  }

  async storeList() {
    await this.api.getWithoutParse(updateLibraryEndpoint, {
      lib_index: this.catalog,
    });

    await this.api.get(updateLibraryEndpoint, {
      cat_upload: [
        this.catalogType,
        ...this.list.map((item) =>
          [item.name, item.type, item.ra, item.dec].join(",")
        ),
      ].join("\n"),
    });
  }

  async refreshList() {
    this.list =
      (
        await this.api.getWithoutParse(getLibraryEndpoint, {
          cat: this.catalog,
        })
      ).data
        .split("\n")
        .filter(Boolean)
        .map((i) => i.split(","))
        .map(([name, type, ra, dec]) => {
          return { name, type, ra, dec } as Star;
        }) ?? [];

    cachedRecents = clone(this.list);
    this.onRefresh?.(this.list);
  }
}
