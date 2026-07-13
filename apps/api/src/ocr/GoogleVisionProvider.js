export class GoogleVisionProvider {
  name = "google-vision";

  isConfigured() {
    return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VISION_API_KEY);
  }

  async extractText({ buffer }) {
    if (!this.isConfigured()) {
      throw new Error("Google Vision is not configured");
    }

    const apiKey = String(process.env.GOOGLE_VISION_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error("Google Vision service-account OCR is not implemented yet; set GOOGLE_VISION_API_KEY for REST OCR");
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: buffer.toString("base64") },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || `Google Vision OCR failed with HTTP ${response.status}`;
      throw new Error(message);
    }

    const result = data?.responses?.[0];
    if (result?.error?.message) {
      throw new Error(result.error.message);
    }

    const text = String(result?.fullTextAnnotation?.text || result?.textAnnotations?.[0]?.description || "").trim();
    const confidenceValues = Array.isArray(result?.fullTextAnnotation?.pages)
      ? result.fullTextAnnotation.pages
          .map(page => Number(page?.confidence))
          .filter(value => Number.isFinite(value) && value > 0)
      : [];
    const confidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : text ? 0.9 : 0;

    return {
      text,
      confidence,
      warnings: text ? [] : ["Google Vision did not find readable text in this image"],
    };
  }
}
