import fs from "fs/promises";
import crypto from "crypto";

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

async function sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

async function getCachedFile(
    url: string,
    cacheKey: string
): Promise<ArrayBuffer> {
    const cacheDir = ".cache";
    const cacheFilePath = `${cacheDir}/${cacheKey}`;
    try {
        const stats = await fs.stat(cacheFilePath);
        if (stats.isFile()) {
            const data = await fs.readFile(cacheFilePath);
            return toArrayBuffer(data);
        }
    } catch (error) {
        // File does not exist, proceed to fetch
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch font from ${url}`);
    }
    const data = await response.arrayBuffer();
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFilePath, Buffer.from(data));
    return data;
}

async function loadGoogleFonts(): Promise<
    Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
    const fontsConfig = [
        {
            name: "Maple Mono CN",
            url: "https://tc.skyone.host/static/MapleMono-CN-Regular.ttf",
            weight: 400,
            style: "normal",
        },
    ];

    const fonts = await Promise.all(
        fontsConfig.map(async ({ name, url, weight, style }) => {
            const hash = await sha256(url);
            const cacheKey = `google-fonts-${hash}`;
            const data = await getCachedFile(url, cacheKey);
            return { name, data, weight, style };
        })
    );

    return fonts;
}

export default loadGoogleFonts;
