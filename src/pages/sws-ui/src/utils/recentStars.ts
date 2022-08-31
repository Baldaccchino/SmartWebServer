import { API } from "../api/api";
import { Star } from "../database";
import { clone } from "../utils/compareObjects";

const updateLibraryEndpoint = "mount-ajax-get.txt";
const getLibraryEndpoint = "ajax/library";

let cachedRecents: Star[] = [];

export class RecentStars {
  // use the last catalog in memory
  private recentCatalog = 15;
  private recentCatalogType = "$WebRecents";
  private recentList: Star[] = cachedRecents;
  private onRefresh?: (list: Star[]) => void;

  constructor(private api: API, onRefresh?: (list: Star[]) => void) {
    this.onRefresh = onRefresh;
  }

  getRecentStars(): Star[] {
    return this.recentList;
  }

  addStar(star: Star) {
    this.recentList.push(star);
    return this;
  }

  removeStar(matcher: (star: Star) => boolean) {
    this.recentList = this.recentList.filter((star) => !matcher(star));
    return this.storeList();
  }

  async storeList() {
    await this.api.getWithoutParse(updateLibraryEndpoint, {
      lib_index: this.recentCatalog,
    });

    await this.api.get(updateLibraryEndpoint, {
      cat_upload: [
        this.recentCatalogType,
        ...this.recentList.map((item) =>
          [item.name, item.type, item.ra, item.dec].join(",")
        ),
      ].join("\n"),
    });
  }

  async refreshList() {
    this.recentList = parseResponse(
      (
        await this.api.getWithoutParse(getLibraryEndpoint, {
          cat: this.recentCatalog,
        })
      ).data
    );

    cachedRecents = clone(this.recentList);
    this.onRefresh?.(this.recentList);
  }
}

function parseResponse(r: string) {
  return (
    r
      .split("\n")
      .filter(Boolean)
      .map((i) => i.split(","))
      .map(([name, type, ra, dec]) => {
        return { name, type, ra, dec, source: "manual" } as Star;
      }) ?? []
  );
}
