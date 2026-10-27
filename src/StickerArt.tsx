import type { StickerKind } from "./stickers";
export default function StickerArt({ kind }: { kind: StickerKind }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="sticker-art"
    >
      <g
        stroke="#45483b"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "pasta" && (
          <>
            <ellipse cx="50" cy="56" rx="35" ry="26" fill="#fff8e8" />
            <ellipse cx="50" cy="52" rx="29" ry="20" fill="#e9c88f" />
            <path d="M29 55c35-35 60 8 11 7-29-2 0-30 25-15s-35 23-35 1c1-16 45-5 32 9s-34-10-14-17M23 37l-6-12m9 9-1-13M69 74l12 8" />
            <path d="m52 22 3-8m-2 4 7 1" stroke="#82905c" />
          </>
        )}
        {kind === "strawberry" && (
          <>
            <path
              d="M26 35q24-15 48 0c17 16-9 51-24 54C35 86 9 51 26 35Z"
              fill="#e8a09a"
            />
            <path
              d="m49 34-16-15 17 6L55 9l5 17 15-5-12 16-14-3Z"
              fill="#a2b286"
            />
            <path d="m34 45 2 4m15-8 1 4m14 3-2 4m-22 8 2 3m15 0-1 4m-8 9v3" />
          </>
        )}
        {kind === "mushroom" && (
          <>
            <path d="m41 52-5 32q14 12 29 0l-7-32" fill="#fff6df" />
            <path d="M13 52C12 2 84 3 88 52q-38 20-75 0Z" fill="#cc8b77" />
            <path d="M18 53q34 11 64-1" />
            <ellipse cx="35" cy="32" rx="7" ry="5" fill="#fff4dd" />
            <ellipse cx="65" cy="27" rx="8" ry="6" fill="#fff4dd" />
            <path d="m15 89 3-8m59 9 5-11" stroke="#8e9a66" />
          </>
        )}
        {kind === "flower" && (
          <>
            <path
              d="M50 53q-8 19 3 39m-2-15Q24 56 28 76q9 13 24 7m-3-17q25-23 23-4-3 11-21 15"
              fill="#aab997"
            />
            <path
              d="M49 36C17 17 19 50 39 49 12 68 47 79 50 55c10 27 35 8 16-5 28-3 16-30-6-13 9-29-20-29-11-1Z"
              fill="#e6b7b1"
            />
            <circle cx="51" cy="45" r="10" fill="#e2c477" />
          </>
        )}
        {kind === "cat" && (
          <>
            <path
              d="m26 37-1-22 22 15 12-1 17-15 1 25c24 46-59 64-57 13Z"
              fill="#e8d5b8"
            />
            <path d="m30 28 1-7 9 8m27-1 6-7-1 12" stroke="#ce9a92" />
            <path d="m35 50 3-1m24 0 3 1m-13 8-4 1 2 3 2-4m-2 5q-8 7-11-1m11 1q5 7 10-1M19 55l-12-3m14 11L8 65m67-11 15-3m-15 12 15 3" />
            <circle cx="31" cy="59" r="4" fill="#e7b2aa" stroke="none" />
            <circle cx="68" cy="59" r="4" fill="#e7b2aa" stroke="none" />
          </>
        )}
        {kind === "chicken" && (
          <>
            <path
              d="M29 36Q8 75 42 83c26 5 43-15 36-39l-11 8-7-28-12-5-10 9-9 8Z"
              fill="#fff8e4"
            />
            <path d="M40 25c-8-14 5-22 9-10 4-13 17-5 8 6m-9 63-2 9m15-11 4 9m-24 2h11m9-2h11" />
            <path d="m29 33-12 5 12 5" fill="#dfba73" />
            <circle cx="40" cy="33" r="2" fill="#45483b" />
            <path d="M45 55q17 22 29 0" />
          </>
        )}
        {kind === "heart" && (
          <>
            <path
              d="M50 83C-6 53 19 4 50 33 80 2 107 51 50 83Z"
              fill="#dba4a3"
            />
            <path d="M24 37q3-8 11-6" stroke="#fff9ed" strokeWidth="4" />
            <path d="m76 13 4-7m5 17 7-2" stroke="#9ba77a" />
          </>
        )}
        {kind === "sparkle" && (
          <>
            <path
              d="m51 12 10 28 27 10-27 10-10 28-10-28-28-10 28-10Z"
              fill="#e3c878"
            />
            <path
              d="m81 8 3 10 9 3-9 4-3 9-3-9-9-4 9-3ZM14 73l3 8 9 3-9 4-3 8-3-8-9-4 9-3Z"
              fill="#c0cba8"
            />
          </>
        )}
        {kind === "coffee" && (
          <>
            <path d="M23 36h48v28c0 25-48 25-48 0V36Z" fill="#c0caaa" />
            <path d="M71 41c28-6 26 29 0 23m-57 23h69M36 25c-11-9 9-12 0-22m16 22c-11-9 9-12 0-22" />
            <ellipse cx="47" cy="36" rx="24" ry="7" fill="#91674f" />
            <path
              d="M46 40c-12-5-6-12 0-6 7-6 11 3 0 6Z"
              fill="#fff8e8"
              stroke="none"
            />
          </>
        )}
        {kind === "bread" && (
          <>
            <path
              d="M14 48C10 16 70 9 85 36q13 18 1 34l-58 14q-17-3-14-36Z"
              fill="#dfb880"
            />
            <path d="M19 51c4-31 62-32 68-8M34 39l5 17m14-22 5 15m12-18 5 13M22 75l58-14" />
            <path d="m18 20 3-7m61 64 5 5" stroke="#9ea97b" />
          </>
        )}
      </g>
    </svg>
  );
}
