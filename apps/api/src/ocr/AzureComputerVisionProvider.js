export class AzureComputerVisionProvider {
  name = "azure-computer-vision";

  isConfigured() {
    return Boolean(process.env.AZURE_COMPUTER_VISION_ENDPOINT && process.env.AZURE_COMPUTER_VISION_KEY);
  }

  async extractText() {
    if (!this.isConfigured()) {
      throw new Error("Azure Computer Vision is not configured");
    }
    throw new Error("Azure Computer Vision SDK integration is not implemented yet");
  }
}
