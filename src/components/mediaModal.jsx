/**
 * MediaModal Component
 *
 * Full-screen media artifact lightbox preview supporting image and video inspection,
 * keyboard Escape dismissal, and artifact downloads.
 * Extracted from activityFeed.jsx (where it was misplaced as an unrendered dumping ground)
 * to uphold Single Responsibility Principle (SRP).
 */
import { useEffect } from "react";
import { T } from "../config/theme.js";
import { Ic } from "./ui.jsx";
import { safeMediaMimeType, safeMediaBase64 } from "../utils/validation.js";
import { fmtBytes } from "../utils/format.js";
import { parseDateMs, fmtTime } from "../utils/date.js";

const MediaModal = ({ media, onClose }) => {
  if (!media) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const mime = safeMediaMimeType(media.mimeType);
  const base64Data = safeMediaBase64(media.data);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = `data:${mime};base64,${base64Data}`;
    link.download = `jules-artifact-${Date.now()}.${mime.split("/")[1] || "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideo = mime.startsWith("video/");
  const dataSize = base64Data ? base64Data.length * 0.75 : 0; // Approx base64 to bytes

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10000,
        background:"rgba(4,5,7,0.95)", backdropFilter:"blur(10px)",
        display:"flex", flexDirection:"column",
        animation:"fadeIn .2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"16px 20px",
        background:"linear-gradient(to bottom, rgba(7,9,12,0.8), transparent)",
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:T.text, fontWeight:700 }}>
            MEDIA ARTIFACT
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.textDim }}>
            {mime} · {fmtBytes(dataSize/1024)} · {fmtTime(parseDateMs(media.ts))}
          </div>
        </div>
        <button
          onClick={handleDownload}
          title="Save Artifact"
          aria-label="Save Artifact"
          style={{
            background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:8,
            padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
          }}
        >
          <Ic n="download" s={14} c={T.brand}/>
          SAVE
        </button>
        <button
          onClick={onClose}
          title="Close Preview"
          aria-label="Close Preview"
          style={{
            background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:8,
            padding:"8px", cursor:"pointer", display:"flex",
          }}
        >
          <Ic n="x" s={18} c={T.text}/>
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:20, overflow:"hidden",
      }}>
        {isVideo ? (
          <video
            src={`data:${mime};base64,${base64Data}`}
            controls autoPlay loop playsInline
            style={{
              maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
              borderRadius:4, boxShadow:"0 20px 50px rgba(0,0,0,0.5)",
              animation:"zoomIn .25s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={`data:${mime};base64,${base64Data}`}
            alt="artifact-preview"
            style={{
              maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
              borderRadius:4, boxShadow:"0 20px 50px rgba(0,0,0,0.5)",
              animation:"zoomIn .25s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Footer / Hint */}
      <div style={{
        padding:20, textAlign:"center", fontFamily:"'JetBrains Mono',monospace",
        fontSize:11, color:T.textDim, letterSpacing:"0.05em",
      }}>
        TAP OUTSIDE TO CLOSE
      </div>
    </div>
  );
};

export { MediaModal };
