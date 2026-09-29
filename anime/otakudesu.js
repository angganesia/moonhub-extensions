import { Bridge } from "./Bridge";

export class JSRunner {
  /**
   * Meng-evaluasi dan menjalankan skrip JS ekstensi secara aman
   * @param {string} scriptContent - Isi teks kode .js ekstensi
   * @returns {Object} Instans/Objek ekstensi yang siap dipanggil
   */
  static run(scriptContent) {
    try {
      // Context yang disediakan untuk ekstensi
      const context = {
        bridge: Bridge,
        console: console,
        exports: {},
      };

      // Kode pembungkus dipisah agar tidak memicu escape parsing pada scriptContent
      const wrappedScript =
        scriptContent +
        "\n; return typeof Otakudesu !== 'undefined' ? Otakudesu : (exports.default || exports);";

      // Eksekusi skrip via Function constructor
      const executeScript = new Function("bridge", "console", "exports", wrappedScript);

      const extensionInstance = executeScript(
        context.bridge,
        context.console,
        context.exports
      );

      if (!extensionInstance) {
        throw new Error("Gagal mengekstrak objek Extension dari skrip.");
      }

      return extensionInstance;
    } catch (error) {
      console.error("Error running extension script:", error);
      throw error;
    }
  }
}
