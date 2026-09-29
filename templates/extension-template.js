const ExtensionTemplate = {
  // Metadata Ekstensi (Wajib)
  metadata: {
    id: "nama_provider", // Harus unik & huruf kecil tanpa spasi (misal: "samehadaku")
    name: "Nama Provider",
    baseUrl: "https://url-target.com",
    version: "1.0.0",
    type: "anime",
    lang: "id",
    isNsfw: false,
  },

  // 1. Mengambil daftar anime ongoing / terbaru di halaman utama
  async getLatest(page = 1) {
    try {
      const targetUrl = `${this.metadata.baseUrl}/ongoing/page/${page}/`;
      const html = await bridge.fetchText(targetUrl);
      const $ = bridge.parseHTML(html);

      const results = [];
      $(".card-selector").each((_, el) => {
        const title = $(el).find(".title-selector").text().trim();
        const cover = $(el).find("img").attr("src") || "";
        const href = $(el).find("a").attr("href") || "";
        const episode = $(el).find(".ep-selector").text().trim();

        if (title && href) {
          results.push({
            id: href, // Gunakan URL/Slug unik sebagai ID
            title: title,
            cover: cover || "https://via.placeholder.com/150",
            episode: episode || "New",
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

  // 2. Mencari anime berdasarkan query kata kunci
  async search(query, page = 1) {
    try {
      const targetUrl = `${this.metadata.baseUrl}/?s=${encodeURIComponent(query)}`;
      const html = await bridge.fetchText(targetUrl);
      const $ = bridge.parseHTML(html);

      const results = [];
      $(".search-selector").each((_, el) => {
        const title = $(el).find(".title-selector").text().trim();
        const href = $(el).find("a").attr("href") || "";
        const cover = $(el).find("img").attr("src") || "";
        const status = $(el).find(".status-selector").text().trim();
        const rating = $(el).find(".rating-selector").text().trim();

        if (title && href) {
          results.push({
            id: href,
            title: title,
            cover: cover || "https://via.placeholder.com/150",
            status: status || "N/A",
            rating: rating || "N/A",
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

  // 3. Mengambil detail informasi anime & list episode
  async getDetail(itemUrl) {
    try {
      const html = await bridge.fetchText(itemUrl);
      const $ = bridge.parseHTML(html);

      const title = $(".title-selector").text().trim();
      const cover = $(".cover-selector img").attr("src") || "";
      const synopsis = $(".synopsis-selector").text().trim();

      const genres = [];
      $(".genre-selector a").each((_, el) => {
        genres.push($(el).text().trim());
      });

      const episodes = [];
      $(".episode-list-selector li").each((_, el) => {
        const anchor = $(el).find("a").first();
        if (anchor.length) {
          episodes.push({
            name: anchor.text().trim(),
            url: anchor.attr("href") || "",
            uploadDate: $(el).find(".date-selector").text().trim() || "Tersedia",
          });
        }
      });

      return {
        title,
        cover,
        synopsis,
        genres,
        episodes,
      };
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getDetail:`, error);
      return null;
    }
  },

  // 4. Mengambil sumber embed / stream video
  async getStreamSources(episodeUrl) {
    try {
      const html = await bridge.fetchText(episodeUrl);
      const $ = bridge.parseHTML(html);

      const sources = [];

      // Ambil default player iframe jika ada
      const defaultIframe = $("iframe").attr("src") || "";
      if (defaultIframe) {
        sources.push({
          server: "Default Server",
          quality: "Auto",
          url: defaultIframe,
          headers: {
            Referer: this.metadata.baseUrl,
          },
        });
      }

      return sources;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getStreamSources:`, error);
      return [];
    }
  },
};

// Wajib mengekspor objek modul agar dapat dibaca oleh JSRunner
module.exports = ExtensionTemplate;
