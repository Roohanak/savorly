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
        {kind === "baby" && <><path d="M24 75q26-30 52 0v17H24z" fill="#cfc0e9"/><circle cx="50" cy="42" r="30" fill="#ffe0c4"/><path d="M45 13q18-18 16-1M38 41h1m22 0h1M44 54q6 7 12 0"/><ellipse cx="30" cy="51" rx="5" ry="3" fill="#f1afbc" stroke="none"/><ellipse cx="70" cy="51" rx="5" ry="3" fill="#f1afbc" stroke="none"/></>}
        {kind === "teddy" && <><circle cx="25" cy="24" r="15" fill="#e6c5a1"/><circle cx="75" cy="24" r="15" fill="#e6c5a1"/><ellipse cx="50" cy="70" rx="26" ry="25" fill="#e6c5a1"/><circle cx="50" cy="40" r="30" fill="#edd4b8"/><ellipse cx="50" cy="49" rx="14" ry="10" fill="#fff1db"/><path d="M36 36h1m26 0h1M46 46l4 4 4-4m-4 4v5"/><path d="m42 71 8 7 8-7" stroke="#c185a0"/></>}
        {kind === "cloud" && <><path d="M20 70C-2 64 6 37 27 38c-2-34 48-38 51-3 29-2 32 35 6 35z" fill="#ecf2ff"/><path d="M37 51h1m25 0h1M44 62q7 8 14 0"/></>}
        {kind === "rainbow" && <><path d="M12 78V55a38 38 0 0 1 76 0v23" stroke="#e8a6b8" strokeWidth="12"/><path d="M24 78V55a26 26 0 0 1 52 0v23" stroke="#f1d692" strokeWidth="10"/><path d="M35 78V55a15 15 0 0 1 30 0v23" stroke="#b5d6c9" strokeWidth="10"/></>}
        {kind === "blocks" && <><rect x="9" y="49" width="38" height="38" rx="5" fill="#edc0cd"/><rect x="51" y="49" width="38" height="38" rx="5" fill="#cfc2ea"/><rect x="30" y="8" width="38" height="38" rx="5" fill="#f4dda6"/><path d="m40 35 9-17 9 17m-14-6h10M20 77V59h9q12 4 0 9 12 4 0 9zM77 60q-17-5-17 8t17 8"/></>}
        {kind === "bottle" && <><path d="M40 22v-8q10-15 20 0v8" fill="#eed5c1"/><rect x="30" y="22" width="40" height="12" rx="5" fill="#cabbe6"/><path d="M34 34h32l8 15v33q0 9-10 9H36q-10 0-10-9V49z" fill="#fff5df"/><path d="M28 59h44M59 47h10M59 70h10M59 80h10"/></>}
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

        {kind === "croissant" && (
          <>
            <path
              d="M14 63Q3 27 34 27l16 8 16-8q31 0 20 36L72 79 61 60H39L28 79Z"
              fill="#e5b878"
            />
            <path d="m34 27 5 33m27-33-5 33M16 46l17 4m51-4-17 4M40 34l3 15m16-15-3 15" />
          </>
        )}
        {kind === "cupcake" && (
          <>
            <path d="m24 53 8 34h36l8-34" fill="#e8afbd" />
            <path
              d="M19 52q-5-15 12-20-1-14 17-15 15-3 21 14 18 4 13 21-15 9-31 0-17 9-32 0Z"
              fill="#fff0d5"
            />
            <path d="m36 61 4 20m12-20v20m14-20-4 20" />
            <circle cx="50" cy="14" r="7" fill="#bd5861" />
          </>
        )}
        {kind === "cake" && (
          <>
            <path d="M20 42h60v42H20Z" fill="#f0c3b3" />
            <path
              d="M18 43q6-18 32-18t32 18v13q-9 10-16-2-9 12-16 0-8 12-15 0-8 10-17 0Z"
              fill="#fff1d5"
            />
            <path d="M17 85h66M24 70h52M50 25V12" />
            <path d="M50 3q-9 9 0 9 9 0 0-9Z" fill="#e3b25e" />
          </>
        )}
        {kind === "cookie" && (
          <>
            <path
              d="M80 41q-23-1-21-24C21 1-3 53 21 79s75 6 68-27q-9 0-9-11Z"
              fill="#dfb782"
            />
            <path
              d="m29 30 4 5m12 16 3-5m-23 14 6 3m25 11 4-5m17-7 3 4"
              stroke="#825a40"
              strokeWidth="5"
            />
            <circle cx="45" cy="28" r="2" fill="#825a40" />
          </>
        )}
        {kind === "pie" && (
          <>
            <path d="m14 48 10 34h52l10-34Z" fill="#d2a06d" />
            <ellipse cx="50" cy="46" rx="38" ry="17" fill="#bd6d64" />
            <path
              d="m21 39 52 18m-38-25 47 16M23 55l45-22m-29 27 43-19"
              stroke="#f0cb98"
              strokeWidth="5"
            />
            <path
              d="M17 45q3-13 11-8 6-11 14-5 9-9 17-1 11-5 16 5 11-2 11 11"
              stroke="#dfb67c"
              strokeWidth="5"
            />
          </>
        )}
        {kind === "pancakes" && (
          <>
            <ellipse cx="50" cy="80" rx="41" ry="10" fill="#f2e8d5" />
            <path d="M18 47v27c2 17 64 17 66 0V47" fill="#deb883" />
            <path d="M18 59c0 14 66 14 66 0M18 70c0 14 66 14 66 0" />
            <ellipse cx="51" cy="45" rx="33" ry="13" fill="#e7c28c" />
            <path
              d="M23 42q24-17 52 0v15q-9 12-14-3-8 15-15-1-10 4-23-1Z"
              fill="#b9814e"
            />
            <path d="m40 36 19-4 9 8-19 5Z" fill="#f1dc87" />
          </>
        )}
        {kind === "cherries" && (
          <>
            <circle cx="28" cy="68" r="18" fill="#c76c77" />
            <circle cx="72" cy="68" r="18" fill="#d1838a" />
            <path
              d="M28 50Q38 10 63 12q-2 26 9 38M58 16q-25-21-29 0 12 12 29 0Z"
              fill="#a6b78b"
            />
            <path d="m20 63 4-5m40 5 4-5" stroke="#fff4e2" strokeWidth="4" />
          </>
        )}
        {kind === "lemon" && (
          <>
            <path
              d="M14 49q8-33 39-28 29-2 34 30l-5 3q-8 31-38 26-29 2-32-27Z"
              fill="#ead47a"
            />
            <path d="M57 21q3-20 25-16-1 20-25 16Z" fill="#a1b48a" />
            <path d="M25 44q5-12 16-13m24 35 2-2m-39-7 1-2" />
          </>
        )}
        {kind === "carrot" && (
          <>
            <path d="M27 30c7-13 24-15 31-3L27 91q-5 4-6-2Z" fill="#e3ac72" />
            <path d="m40 24-4-18 12 13 9-15 1 17 19-9-15 18" fill="#a2b887" />
            <path d="m29 45 10 4m-13 9 8 4m-10 8 6 2" />
          </>
        )}
        {kind === "avocado" && (
          <>
            <path
              d="M49 10c-13 0-17 23-31 40-17 33 7 43 31 43s48-10 31-43C65 33 62 10 49 10Z"
              fill="#a7b789"
            />
            <path
              d="M49 20C38 21 36 40 25 55 10 83 33 86 49 86s40-3 24-31C62 40 61 21 49 20Z"
              fill="#e5e4b2"
            />
            <ellipse cx="49" cy="64" rx="17" ry="19" fill="#b38a6a" />
          </>
        )}
        {kind === "teapot" && (
          <>
            <path d="M27 42c-16 35 1 43 23 43s39-8 23-43Z" fill="#d5b9c9" />
            <path d="M30 43h40M35 34q15-15 30 0M50 28V18m-4-1h8M28 50 8 35l7 30 13 7m43-27q30-15 24 17-3 15-20 14" />
            <path
              d="M44 63c-9-7-15 7 6 17 21-10 15-24 6-17l-6 5Z"
              fill="#f4ddd1"
            />
          </>
        )}
        {kind === "jar" && (
          <>
            <rect x="23" y="26" width="54" height="62" rx="9" fill="#f1d9b5" />
            <path d="M27 16h46v13H27Z" fill="#c67e86" />
            <path
              d="m31 17 5 11m7-11 5 11m7-11 5 11m7-11 5 11"
              stroke="#fff5df"
            />
            <rect x="29" y="44" width="42" height="29" rx="3" fill="#fff5df" />
            <path d="M50 65c-17-10-13-20 0-11 13-9 17 1 0 11Z" fill="#c67e86" />
          </>
        )}
        {kind === "whisk" && (
          <>
            <path d="m35 62-23 22q-6 9 3 12l25-25Z" fill="#cfa584" />
            <path d="M36 65c-35-35 34-73 50-49S73 86 36 65Zm0 0c-4-23 29-65 45-51M36 65c27 5 59-32 48-47M36 65 83 16" />
          </>
        )}
        {kind === "bow" && (
          <>
            <path
              d="M43 43C0 5 4 63 38 59L24 87l22-10 7 13 8-34c37 16 43-41 4-14Z"
              fill="#dfa4b2"
            />
            <ellipse cx="52" cy="49" rx="12" ry="11" fill="#efc5ca" />
            <path d="m19 38 21 10m25 0 17-11M45 61l-8 15m22-16-1 15" />
          </>
        )}
        {kind === "bee" && (
          <>
            <ellipse
              cx="39"
              cy="30"
              rx="16"
              ry="20"
              transform="rotate(-30 39 30)"
              fill="#e6edf0"
            />
            <ellipse
              cx="65"
              cy="30"
              rx="16"
              ry="20"
              transform="rotate(30 65 30)"
              fill="#e6edf0"
            />
            <ellipse cx="51" cy="60" rx="31" ry="23" fill="#e5ca7a" />
            <path d="M39 39v43m20-43v43" strokeWidth="7" />
            <circle cx="76" cy="58" r="2" fill="#45483b" />
            <path d="m20 64-9 4m60-4 4 3" />
          </>
        )}
        {kind === "butterfly" && (
          <>
            <path
              d="M46 49C-7-16-6 67 31 61 2 91 42 104 48 64 54 104 94 91 65 61 102 67 101-16 51 49Z"
              fill="#c6bad5"
            />
            <path d="M49 46v32m-2-32-8-11m12 11 9-11" />
            <path
              d="M23 34q-10 20 11 18m40-18q10 20-11 18"
              stroke="#f7eadb"
              strokeWidth="5"
            />
          </>
        )}
      </g>
    </svg>
  );
}
