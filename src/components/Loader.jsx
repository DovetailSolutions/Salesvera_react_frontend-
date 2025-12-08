import React from "react";

/**
 * Loader component
 * Props:
 *  - variant: 'spinner' | 'dots' | 'bars'   (default: 'spinner')
 *  - size: number (controls width/height in px for spinner; default: 48)
 *  - message: string (optional text under loader)
 *  - backdrop: boolean (if true shows semi-opaque backdrop; default: false)
 */
function Loader({ variant = "spinner", size = 48, message = "", backdrop = false }) {
  const commonContainer =
    "min-h-screen w-full fixed top-0 left-0 flex justify-center items-center z-20 bg-white";

  return (
    <div
      role="status"
      aria-busy="true"
      className={`${commonContainer} ${backdrop ? "bg-black/40" : ""}`}
    >
      <div className="flex flex-col items-center gap-3">
        {variant === "spinner" && (
          <svg
            className="animate-spin"
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}

        {variant === "dots" && (
          <div className="flex items-center gap-2">
            <span
              className="block rounded-full w-3 h-3 bg-sky-600 animate-bounce"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="block rounded-full w-3 h-3 bg-sky-600 animate-bounce"
              style={{ animationDelay: "0.12s" }}
            />
            <span
              className="block rounded-full w-3 h-3 bg-sky-600 animate-bounce"
              style={{ animationDelay: "0.24s" }}
            />
          </div>
        )}

        {variant === "bars" && (
          <div className="flex items-end gap-1.5 h-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 rounded-sm bg-sky-600"
                style={{
                  height: `${10 + i * 6}px`,
                  animation: "loader-bars 0.9s ease-in-out infinite",
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}

        {message && (
          <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
            {message}
          </div>
        )}

        {/* inline keyframes for bars animation (Tailwind doesn't provide these by default) */}
        <style jsx>{`
          @keyframes loader-bars {
            0%,
            100% {
              transform: scaleY(0.6);
              opacity: 0.7;
            }
            50% {
              transform: scaleY(1.1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default Loader;
