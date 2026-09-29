const AnoboyBe = {
  metadata: {
    id: "anoboybe",
    name: "AnoboyBe",
    baseUrl: "https://anoboy.be",
    version: "1.0.0",
    type: "anime",
    lang: "id",
    isNsfw: false,
  },

  // 1. Ambil daftar update anime terbaru di halaman utama
  async getLatest(page = 1) {
    try {
      const targetUrl =
        page > 1
          ? this.metadata.baseUrl + "/page/" + page + "/"
          : this.metadata.baseUrl + "/";
      const html = await bridge.fetchText(targetUrl);
      const $ = bridge.parseHTML(html);

      const results = [];

      $(".home_index a, .content .home_index div.sitemap").each((_, el) => {
        const anchor = $(el).is("a") ? $(el) : $(el).find("a").first();
        const title =
          anchor.attr("title") ||
          $(el).find(".jjudul").text().trim() ||
          anchor.text().trim();
        const href = anchor.attr("href") || "";
        const cover = $(el).find("img").attr("src") || "";

        if (title && href && !href.includes("/category/")) {
          results.push({
            id: href,
            title: title,
            cover: cover.startsWith("http")
              ? cover
              : this.metadata.baseUrl + cover,
            type: "anime",
          });
        }
      });

      return results;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getLatest:`, error);
      return [];
    }
  },

  // 2. Pencarian Anime
  async search(query, page = 1) {
    try {
      const targetUrl =
        this.metadata.baseUrl + "/?s=" + encodeURIComponent(query);
      const html = await bridge.fetchText(targetUrl);
      const $ = bridge.parseHTML(html);

      const results = [];

      $(".column-content a").each((_, el) => {
        const title = $(el).attr("title") || $(el).text().trim();
        const href = $(el).attr("href") || "";
        const cover = $(el).find("img").attr("src") || "";

        if (title && href) {
          results.push({
            id: href,
            title: title,
            cover: cover.startsWith("http")
              ? cover
              : this.metadata.baseUrl + cover,
            type: "anime",
          });
        }
      });

      return results;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error search:`, error);
      return [];
    }
  },

  // 3. Detail Anime & List Episode
  async getDetail(itemUrl) {
    try {
      const html = await bridge.fetchText(itemUrl);
      const $ = bridge.parseHTML(html);

      const title =
        $(".entry-title").text().trim() \vert{ }\vert{ } $("h1").first().text().trim();
      const cover = $(".entry-content img").first().attr("src") || "";
      const synopsis = $(".entry-content p").first().text().trim();

      const genres = [];
      $(".entry-content a[rel='tag']").each((_, el) => {
        genres.push($(el).text().trim());
      });

      const episodes = [];

      $(".entry-content a").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();

        if (
          href.includes(this.metadata.baseUrl) &&
          text.toLowerCase().includes("episode")
        ) {
          episodes.push({
            name: text,
            url: href,
            uploadDate: "Tersedia",
          });
        }
      });

      if (episodes.length === 0) {
        episodes.push({
          name: title,
          url: itemUrl,
          uploadDate: "Tersedia",
        });
      }

      return {
        title,
        cover: cover.startsWith("http")
          ? cover
          : this.metadata.baseUrl + cover,
        synopsis,
        genres,
        episodes,
      };
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getDetail:`, error);
      return null;
    }
  },

  // 4. Ambil Sumber Embed Stream Video
  async getStreamSources(episodeUrl) {
    try {
      const html = await bridge.fetchText(episodeUrl);
      const $ = bridge.parseHTML(html);

      const sources = [];

      const iframeSrc =
        $("#v2iframe").attr("src") \vert{ }\vert{ } $("iframe").first().attr("src") || "";

      if (iframeSrc) {
        sources.push({
          server: "Anoboy Player",
          quality: "Auto",
          url: iframeSrc.startsWith("//") ? "https:" + iframeSrc : iframeSrc,
          headers: {
            Referer: this.metadata.baseUrl,
          },
        });
      }

      $("#selectonline option, .server-option").each((_, el) => {
        const val = $(el).val() \vert{ }\vert{ }$(el).attr("data-url") || "";
        const name = $(el).text().trim() || "Server Alternative";

        if (val && val !== iframeSrc) {
          sources.push({
            server: name,
            quality: "Auto",
            url: val.startsWith("//") ? "https:" + val : val,
            headers: {
              Referer: this.metadata.baseUrl,
            },
          });
        }
      });

      return sources;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getStreamSources:`, error);
      return [];
    }
  },
};

module.exports = AnoboyBe;
