const BASE_URL = "https://image.lgtmoon.dev";

export function buildImageUrl(imageNumber: number): string {
  return `${BASE_URL}/${imageNumber}`;
}
