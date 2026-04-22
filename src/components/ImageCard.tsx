import { useState } from "react";

type ImageCardProps = {
  url: string;
  imageNumber: number;
  onRemove?: () => void;
  onIgnore?: (imageNumber: number) => void;
  showActions?: boolean;
};

export function ImageCard({
  url,
  imageNumber,
  onRemove,
  onIgnore,
  showActions = true,
}: ImageCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`![LGTM](${url})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="image-card">
      <div className="image-card-img-wrapper">
        <img src={url} alt={`LGTM #${imageNumber}`} loading="lazy" />
      </div>
      <div className="image-card-info">
        <span className="image-number">#{imageNumber}</span>
        {showActions && (
          <div className="image-card-actions">
            <button className="btn btn-sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy URL"}
            </button>
            {onRemove && (
              <button className="btn btn-sm btn-danger" onClick={onRemove}>
                Remove
              </button>
            )}
            {onIgnore && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => onIgnore(imageNumber)}
              >
                Ignore
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
