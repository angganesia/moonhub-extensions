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

      // Iterasi pada setiap elemen kartu anime (.bsx a)
      $(".listupd article .bsx a").each((_, el) => {
        const anchor = $(el);
        const href = anchor.attr("href") || "";
        const title =
          anchor.attr("title") ||
          anchor.find("h2").text().trim() ||
          anchor.find(".tt").text().trim();

        const cover =
          anchor.find("img").attr("src") ||
          anchor.find("img").attr("data-src") ||
          "";

        // Mengambil Status (misal: "Completed" atau "Ongoing")
        let status =
          anchor.find(".status").text().trim() ||
          anchor.find(".epx").text().trim() ||
          "N/A";

        // Mengambil Tipe (misal: "TV", "Special", "Live Action")
        let typez = anchor.find(".typez").text().trim();

        if (title && href) {
          results.push({
            id: href,
            title: title,
            cover: cover.startsWith("http")
              ? cover
              : this.metadata.baseUrl + cover,
            status: status,
            type: typez || "anime",
          });
        }
      });

      return results;
    } catch (error) {
      console.error("[" + this.metadata.id + "] Error search:", error);
      return [];
    }
  },


  // 3. Detail Anime & List Episode
  async getDetail(itemUrl) {
    try {
      const html = await bridge.fetchText(itemUrl);
      const $ = bridge.parseHTML(html);

      // Extract Judul Utama
      const title =
        $(".entry-title").text().trim() ||
        $("h1.entry-title").text().trim() ||
        "Unknown Title";

      // Extract Gambar Cover
      const cover =
        $(".thumbook .thumb img").attr("src") ||
        $(".bigcontent img").attr("src") ||
        "";

      // Extract Sinopsis
      const synopsis =
        $(".bixbox.synp .entry-content p")
          .map((_, el) => $(el).text().trim())
          .get()
          .join("\n\n") || "Tidak ada sinopsis.";

      // Extract Genres
      const genres = [];
      $(".genxed a").each((_, el) => {
        const genreName = $(el).text().trim();
        if (genreName) genres.push(genreName);
      });

      // Extract Status & Detail Info Tambahan
      let status = "Ongoing";
      $(".spe span").each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes("Status:")) {
          status = text.replace("Status:", "").trim();
        }
      });

      // Extract Daftar Episode (.eplister ul li)
      const episodes = [];
      $(".eplister ul li a").each((_, el) => {
        const epUrl = $(el).attr("href") || "";
        const epNum = $(el).find(".epl-num").text().trim();
        const epTitle = $(el).find(".epl-title").text().trim();
        const epDate = $(el).find(".epl-date").text().trim();

        if (epUrl) {
          episodes.push({
            name: epTitle || `Episode ${epNum}`,
            url: epUrl,
            uploadDate: epDate || "Tersedia",
          });
        }
      });

      return {
        title,
        cover: cover.startsWith("http")
          ? cover
          : this.metadata.baseUrl + cover,
        synopsis,
        status,
        genres: genres.length > 0 ? genres : [ "Anime" ],
        episodes,
      };
    } catch (error) {
      console.error("[" + this.metadata.id + "] Error getDetail:", error);
      return null;
    }
  },


  // 4. Stream Sources & Embed Video
  async getStreamSources(episodeUrl) {
    try {
      const html = await bridge.fetchText(episodeUrl);
      const $ = bridge.parseHTML(html);

      const streamSources = [];

      // 1. Ambil Embed Video Utama (Iframe di #pembed)
      const defaultIframeSrc = $("#pembed iframe").attr("src");
      if (defaultIframeSrc) {
        streamSources.push({
          server: "Blogger / Default",
          url: defaultIframeSrc.startsWith("//")
            ? "https:" + defaultIframeSrc
            : defaultIframeSrc,
          type: "iframe",
        });
      }

      // 2. Ambil Server Lain dari Dropdown Mirror (Base64 Encoded)
      $(".mirror option").each((_, el) => {
        const val = $(el).attr("value");
        const serverName = $(el).text().trim();

        if (val && val.length > 10) {
          try {
            // Decode Base64 string dari value option
            const decodedHtml = atob(val);
            const match = decodedHtml.match(/src=["']([^"']+)["']/i);

            if (match && match[ 1 ]) {
              const streamUrl = match[ 1 ].startsWith("//")
                ? "https:" + match[ 1 ]
                : match[ 1 ];

              // Pastikan tidak menduplikasi server utama
              if (!streamSources.some((s) => s.url === streamUrl)) {
                streamSources.push({
                  server: serverName || "Mirror Server",
                  url: streamUrl,
                  type: "iframe",
                });
              }
            }
          } catch (e) {
            // Abaikan jika nilai value bukan Base64 valid
          }
        }
      });

      // 3. Ambil Link Download (Gofile / Alternative Direct Link)
      $(".soraurlx a").each((_, el) => {
        const downloadUrl = $(el).attr("href");
        const hostName = $(el).text().trim() || "Download Link";

        if (downloadUrl) {
          streamSources.push({
            server: `Download (${hostName})`,
            url: downloadUrl,
            type: "download",
          });
        }
      });

      return streamSources;
    } catch (error) {
      console.error("[" + this.metadata.id + "] Error getStreamSources:", error);
      return [];
    }
  },

};

module.exports = AnoboyBe;
