# Dependencies

## Runtime

- React 18
- Vite
- TypeScript
- Tailwind
- Electron
- Express
- Supabase client

## AI Providers In Code

Supported provider identifiers in the API are:

- `deepseek`
- `openai`
- `zhipu`
- `qwen`
- `moonshot`

Do not claim other providers are active unless implemented in code and documented.

## Upload/OCR Providers

Provider order is:

1. Aliyun OCR
2. Google Vision
3. Azure Computer Vision

OCR keys stay backend-only.

## Verification Tooling

Common commands:

- `npm run build --workspace=apps/web`
- `npm run electron:build`
- `npm run build`
- `npm run agents:validate`
- `npm run agents:status`
