export class AliyunOCRProvider {
  name = "aliyun";

  isConfigured() {
    return Boolean(process.env.ALIYUN_OCR_ACCESS_KEY_ID && process.env.ALIYUN_OCR_ACCESS_KEY_SECRET);
  }

  async extractText() {
    if (!this.isConfigured()) {
      throw new Error("Aliyun OCR is not configured");
    }
    throw new Error("Aliyun OCR SDK integration is not implemented yet");
  }
}
