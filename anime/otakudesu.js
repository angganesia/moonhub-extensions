const Otakudesu = {
  metadata: {
    id: "otakudesu",
    name: "Otakudesu",
    baseUrl: "https://otakudesu.blog",
    version: "1.1.0",
    type: "anime",
    lang: "id",
    isNsfw: false,
  },

  async getLatest(page = 1) {
    const targetUrl = this.metadata.baseUrl + "/ongoing-anime/page/" + page + "/";
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];
    $(".venlist ul li").each((_, el) => {
      const anchor = $(el).find(".thumb a");
      const title = $(el).find(".jjudul").text().trim();
      const cover = $(el).find(".thumb img").attr("src") || "";
      const href = anchor.attr("href") || "";

      if (title && href) {
        results.push({
          id: href,
          title: title,
          cover: cover,
          type: "anime",
        });
      }
    });

    return results;
  },

  async search(query, page = 1) {
    const targetUrl = this.metadata.baseUrl + "/?s=" + encodeURIComponent(query) + "&post_type=anime";
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];

    $("ul.chivsrc li").each((_, el) => {
      const anchor = $(el).find("h2 a").first();
      const title = anchor.text().trim();
      const href = anchor.attr("href") || anchor.attr("title") || "";

      // Ambil gambar cover (jika ada tag img di li)
      let cover = $(el).find("img").attr("src") || "";

      // Ekstraksi info tambahan
      let genres = [];
      let status = "";
      let rating = "";

      $(el).find(".set").each((_, setEl) => {
        const text = $(setEl).text().trim();
        if (text.includes("Genres") || text.includes("Genre")) {
          $(setEl).find("a").each((_, gAnchor) => {
            genres.push($(gAnchor).text().trim());
          });
        } else if (text.includes("Status")) {
          status = text.replace(/Status\s*:\s*/i, "").trim();
        } else if (text.includes("Rating")) {
          rating = text.replace(/Rating\s*:\s*/i, "").trim();
        }
      });

      if (title && href) {
        results.push({
          id: href,
          title: title,
          cover: cover || "https://via.placeholder.com/150", // Fallback jika tidak ada gambar
          genres: genres.length ? genres : [ "N/A" ],
          status: status || "N/A",
          rating: rating || "N/A",
          type: "anime",
        });
      }
    });

    return results;
  },

  // 2. Perluasan getDetail(): Ambil Title, Cover, Sinopsis, Info Detail, & Episode
  async getDetail(itemUrl) {
    const html = await bridge.fetchText(itemUrl);
    const $ = bridge.parseHTML(html);

    const title = $(".fotoanime .infozin .infozings p:contains('Judul')").text().replace("Judul:", "").trim() || $(".jjudul").text().trim();
    const cover = $(".fotoanime img").attr("src") || "";
    const synopsis = $(".sinopsc").text().trim();

    // Parse info detail (Japanese Title, Skor, Producer, Tipe, Total Episode, Durasi, Rilis)
    const info = {};
    $(".fotoanime .infozin .infozings p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes(":")) {
        const parts = text.split(":");
        const key = parts[ 0 ].trim().toLowerCase().replace(/\s+/g, "_");
        const value = parts.slice(1).join(":").trim();
        if (key && value) {
          info[ key ] = value;
        }
      }
    });

    // Parse daftar genre
    const genres = [];
    $(".fotoanime .infozin .infozings p:contains('Genre') a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    // Parse daftar episode
    const episodes = [];
    $(".episodelist ul li").each((_, el) => {
      const anchor = $(el).find("a").first();
      if (anchor.length) {
        episodes.push({
          name: anchor.text().trim(),
          url: anchor.attr("href") || "",
          uploadDate: $(el).find(".zee-release-date").text().trim(),
        });
      }
    });

    return {
      title,
      cover,
      synopsis,
      info, // Objek berisi detail lengkap (skor, durasi, status, studio, dll)
      genres,
      episodes,
    };
  },

  async getStreamSources(episodeUrl) {
    const html = await bridge.fetchText(episodeUrl);
    const $ = bridge.parseHTML(html);

    const iframeSrc = $(".responsive-embed iframe").attr("src") || $("iframe").attr("src") || "";

    return [
      {
        quality: "Auto",
        url: iframeSrc,
        isHls: iframeSrc.includes(".m3u8"),
        headers: {
          "Referer": this.metadata.baseUrl,
        },
      },
    ];
  },
};

module.exports = Otakudesu;
