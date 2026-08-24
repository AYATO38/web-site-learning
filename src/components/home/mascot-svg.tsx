"use client";

import {
  hairColors,
  shirtOptions,
  skinOptions,
  type MascotOutfit,
} from "@/lib/mascot";

const LINE = "#1c1917";

function colorOf<T extends { id: string; color: string }>(
  list: readonly T[],
  id: string,
  fallback: string,
) {
  return list.find((item) => item.id === id)?.color ?? fallback;
}

function mix(hex: string, target: string, amount: number) {
  const parse = (value: string) => {
    const n = value.replace("#", "");
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ] as const;
  };
  const a = parse(hex);
  const b = parse(target);
  const c = a.map((channel, i) =>
    Math.round(channel + (b[i] - channel) * amount),
  );
  return `#${c.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function HairCap({ color }: { color: string }) {
  return (
    <path
      d="M42 98 C40 58 58 18 100 16 C142 18 160 58 158 98 C152 70 132 52 100 50 C68 52 48 70 42 98 Z"
      fill={color}
      stroke={LINE}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  );
}

function HairBack({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "ponytail") {
    return (
      <g>
        <HairCap color={color} />
        <path
          d="M130 82 Q174 96 164 168 Q148 140 126 98"
          fill={color}
          stroke={LINE}
          strokeWidth="2.2"
        />
        <circle cx="160" cy="168" r="11" fill={color} stroke={LINE} strokeWidth="2" />
      </g>
    );
  }
  if (style === "bun") {
    return (
      <g>
        <HairCap color={color} />
        <circle cx="100" cy="22" r="20" fill={color} stroke={LINE} strokeWidth="2.2" />
        <circle cx="100" cy="22" r="8" fill="#fff" opacity="0.18" />
      </g>
    );
  }
  if (style === "curly") {
    return (
      <g stroke={LINE} strokeWidth="2">
        <circle cx="44" cy="72" r="20" fill={color} />
        <circle cx="58" cy="42" r="20" fill={color} />
        <circle cx="88" cy="24" r="21" fill={color} />
        <circle cx="118" cy="22" r="21" fill={color} />
        <circle cx="146" cy="42" r="20" fill={color} />
        <circle cx="156" cy="74" r="20" fill={color} />
        <circle cx="48" cy="100" r="16" fill={color} />
        <circle cx="152" cy="100" r="16" fill={color} />
        <circle cx="100" cy="36" r="18" fill={color} />
      </g>
    );
  }
  if (style === "messy") {
    return (
      <path
        d="M40 100 L44 48 L62 62 L74 18 L92 44 L100 12 L112 40 L128 16 L144 48 L160 36 L162 102 C148 70 124 50 100 48 C76 50 52 70 40 100 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    );
  }
  if (style === "long") {
    return (
      <g>
        <HairCap color={color} />
        <path
          d="M44 92 C40 128 48 168 62 188 Q78 168 84 128 L78 96 C64 98 52 96 44 92 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2.2"
        />
        <path
          d="M156 92 C160 128 152 168 138 188 Q122 168 116 128 L122 96 C136 98 148 96 156 92 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2.2"
        />
      </g>
    );
  }
  return <HairCap color={color} />;
}

function HairSides({ color }: { color: string }) {
  return (
    <g>
      <path
        d="M46 78 C40 102 44 124 58 130 L62 104 C54 98 50 88 48 78 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M154 78 C160 102 156 124 142 130 L138 104 C146 98 150 88 152 78 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}

function HairFront({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "side") {
    return (
      <g>
        <HairSides color={color} />
        <path
          d="M48 76 Q78 38 148 70 Q118 58 86 86 Q64 100 48 76 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2"
        />
      </g>
    );
  }
  if (style === "messy") {
    return (
      <g>
        <HairSides color={color} />
        <path
          d="M50 78 L62 52 L76 70 L90 44 L104 66 L118 42 L132 68 L148 54 L152 80 Q124 62 100 70 Q76 62 50 78 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (style === "curly") {
    return (
      <g>
        <HairSides color={color} />
        <circle cx="72" cy="68" r="13" fill={color} stroke={LINE} strokeWidth="1.8" />
        <circle cx="94" cy="58" r="12" fill={color} stroke={LINE} strokeWidth="1.8" />
        <circle cx="116" cy="58" r="12" fill={color} stroke={LINE} strokeWidth="1.8" />
        <circle cx="136" cy="70" r="13" fill={color} stroke={LINE} strokeWidth="1.8" />
      </g>
    );
  }
  if (style === "bun") {
    return (
      <g>
        <HairSides color={color} />
        <path
          d="M50 74 Q100 46 150 74 Q128 66 100 70 Q72 66 50 74 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2"
        />
      </g>
    );
  }
  if (style === "long") {
    return (
      <g>
        <HairSides color={color} />
        <path
          d="M48 74 Q78 44 100 58 Q118 44 152 74 Q130 64 100 72 Q72 64 48 74 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2"
        />
      </g>
    );
  }
  return (
    <g>
      <HairSides color={color} />
      <path
        d="M48 76 Q100 42 152 76 Q128 62 100 68 Q72 62 48 76 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2"
      />
    </g>
  );
}

function Eyes({
  kind,
  glasses,
}: {
  kind: MascotOutfit["eyes"];
  glasses: MascotOutfit["glasses"];
}) {
  const hidden = glasses === "sun";
  if (kind === "sleepy") {
    return (
      <g stroke={LINE} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M74 90 Q84 84 94 90" />
        <path d="M106 90 Q116 84 126 90" />
      </g>
    );
  }
  const rx = kind === "almond" ? 8.5 : 10.5;
  const ry = kind === "almond" ? 7.5 : 10.5;
  return (
    <g>
      <ellipse cx="82" cy="90" rx={rx} ry={ry} fill="#fff" stroke={LINE} strokeWidth="2" />
      <ellipse cx="118" cy="90" rx={rx} ry={ry} fill="#fff" stroke={LINE} strokeWidth="2" />
      {!hidden && (
        <>
          <ellipse cx="83" cy="91" rx="4.4" ry="5.4" fill={LINE} />
          <ellipse cx="119" cy="91" rx="4.4" ry="5.4" fill={LINE} />
          <circle cx="85.2" cy="88.4" r="1.8" fill="#fff" />
          <circle cx="121.2" cy="88.4" r="1.8" fill="#fff" />
          {kind === "sparkle" && (
            <g fill="#f5c542">
              <path d="M68 74 L70 79.4 L76 81 L70 82.6 L68 88 L66 82.6 L60 81 L66 79.4 Z" />
              <path d="M132 72 L133.8 76.6 L139 78 L133.8 79.4 L132 84 L130.2 79.4 L125 78 L130.2 76.6 Z" />
            </g>
          )}
        </>
      )}
    </g>
  );
}

function Brows({ kind }: { kind: MascotOutfit["brows"] }) {
  const w = kind === "thick" ? 4.4 : kind === "thin" ? 2 : 3.1;
  if (kind === "raised") {
    return (
      <g stroke={LINE} strokeWidth={w} strokeLinecap="round" fill="none">
        <path d="M70 76 Q82 68 94 76" />
        <path d="M106 78 Q118 72 130 76" />
      </g>
    );
  }
  return (
    <g stroke={LINE} strokeWidth={w} strokeLinecap="round" fill="none">
      <path d="M70 78 Q82 72 94 78" />
      <path d="M106 78 Q118 72 130 78" />
    </g>
  );
}

function Mouth({ kind }: { kind: MascotOutfit["mouth"] }) {
  if (kind === "grin") {
    return (
      <g>
        <path
          d="M84 112 Q100 128 116 112"
          fill="#fff"
          stroke={LINE}
          strokeWidth="2.4"
        />
        <path d="M90 114 Q100 122 110 114" fill="none" stroke="#f43f5e" strokeWidth="2" />
      </g>
    );
  }
  if (kind === "cat") {
    return (
      <path
        d="M90 114 Q96 108 100 114 Q104 108 110 114"
        fill="none"
        stroke={LINE}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    );
  }
  if (kind === "serious") {
    return (
      <path d="M88 114 H112" fill="none" stroke={LINE} strokeWidth="2.6" strokeLinecap="round" />
    );
  }
  if (kind === "wow") {
    return (
      <ellipse cx="100" cy="116" rx="6.5" ry="8" fill="#fff" stroke={LINE} strokeWidth="2.2" />
    );
  }
  return (
    <path
      d="M86 112 Q100 124 114 112"
      fill="none"
      stroke={LINE}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  );
}

function Glasses({ kind }: { kind: MascotOutfit["glasses"] }) {
  if (kind === "none") return null;
  const fill = kind === "sun" ? "#18181b" : "none";
  const opacity = kind === "sun" ? 0.72 : 1;
  return (
    <g opacity={opacity} stroke={LINE} strokeWidth="2.6" fill={fill}>
      {kind === "square" ? (
        <>
          <rect x="68" y="80" width="26" height="20" rx="5" />
          <rect x="106" y="80" width="26" height="20" rx="5" />
        </>
      ) : (
        <>
          <circle cx="82" cy="90" r={kind === "sun" ? 14 : kind === "round" ? 13 : 10} />
          <circle cx="118" cy="90" r={kind === "sun" ? 14 : kind === "round" ? 13 : 10} />
        </>
      )}
      <path d="M94 89 H106" />
      <path d="M68 86 Q56 84 52 92" fill="none" />
      <path d="M132 86 Q144 84 148 92" fill="none" />
    </g>
  );
}

function Hat({
  kind,
  back = false,
}: {
  kind: MascotOutfit["hat"];
  back?: boolean;
}) {
  if (kind === "none") return null;
  if (kind === "cap") {
    return (
      <g>
        <path
          d="M50 58 Q100 6 150 58 L152 68 Q100 42 48 68 Z"
          fill="#3b9eff"
          stroke={LINE}
          strokeWidth="2.2"
        />
        <ellipse cx="100" cy="64" rx="50" ry="8" fill="#2563eb" />
        <rect
          x={back ? 34 : 122}
          y="60"
          width="38"
          height="10"
          rx="5"
          fill="#3b9eff"
          stroke={LINE}
          strokeWidth="1.6"
        />
      </g>
    );
  }
  if (kind === "beanie") {
    return (
      <g>
        <path
          d="M50 66 Q100 8 150 66 Q100 48 50 66 Z"
          fill="#be123c"
          stroke={LINE}
          strokeWidth="2.2"
        />
        <ellipse cx="100" cy="66" rx="48" ry="8" fill="#9f1239" />
        <circle cx="100" cy="14" r="10" fill="#fda4af" stroke={LINE} strokeWidth="2" />
      </g>
    );
  }
  if (kind === "headphones") {
    return (
      <g>
        <path
          d="M52 74 Q100 22 148 74"
          fill="none"
          stroke={LINE}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="42" y="74" width="20" height="34" rx="10" fill={LINE} />
        <rect x="138" y="74" width="20" height="34" rx="10" fill={LINE} />
        <rect x="46" y="80" width="12" height="20" rx="6" fill="#3b9eff" />
        <rect x="142" y="80" width="12" height="20" rx="6" fill="#3b9eff" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M108 34 Q126 16 146 38 Q132 30 122 46 Z"
        fill="#fb7185"
        stroke={LINE}
        strokeWidth="2"
      />
      <path
        d="M126 16 Q136 2 152 24 Q140 18 132 32 Z"
        fill="#fb7185"
        stroke={LINE}
        strokeWidth="2"
      />
    </g>
  );
}

function ShirtBody({
  shirt,
  skin,
  back = false,
}: {
  shirt: MascotOutfit["shirt"];
  skin: string;
  back?: boolean;
}) {
  const option = shirtOptions.find((item) => item.id === shirt) ?? shirtOptions[0];
  const color = option.color;
  const dark =
    option.kind === "hoodie" || option.id === "black-tee" || option.kind === "polo";
  const stitch = dark ? "rgba(255,255,255,0.22)" : mix(color, LINE, 0.12);

  return (
    <g>
      {option.kind === "hoodie" && (
        <path
          d="M68 126 Q100 104 132 126 L140 148 Q100 136 60 148 Z"
          fill={color}
          stroke={LINE}
          strokeWidth="2.2"
        />
      )}
      <path
        d="M64 138 Q100 124 136 138 L144 196 Q100 210 56 196 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {option.kind === "stripe" && (
        <g stroke="#3b9eff" strokeWidth="7">
          <path d="M66 156 H134" />
          <path d="M62 174 H138" />
          <path d="M60 192 H140" />
        </g>
      )}
      {!back && option.kind === "polo" && (
        <path d="M90 138 L100 156 L110 138" fill="none" stroke="#14532d" strokeWidth="3.2" />
      )}
      {option.kind === "hoodie" && (
        <path
          d="M86 168 Q100 178 114 168 Q100 188 86 168 Z"
          fill="none"
          stroke={stitch}
          strokeWidth="2.2"
        />
      )}
      {!back && option.id === "white-tee" && (
        <circle cx="100" cy="168" r="6" fill="#3b9eff" />
      )}
      <ellipse cx="52" cy="160" rx="14" ry="18" fill={skin} stroke={LINE} strokeWidth="2" />
      <ellipse cx="148" cy="160" rx="14" ry="18" fill={skin} stroke={LINE} strokeWidth="2" />
      <path d="M64 146 Q50 148 46 166" fill={color} />
      <path d="M136 146 Q150 148 154 166" fill={color} />
    </g>
  );
}

export function MascotSvg({
  outfit,
  view = "front",
}: {
  outfit: MascotOutfit;
  view?: "front" | "back";
}) {
  const skin = colorOf(skinOptions, outfit.skin, "#f0b89a");
  const hair = colorOf(hairColors, outfit.hairColor, "#1c1917");
  const back = view === "back";
  const cheek = mix(skin, "#fb7185", outfit.blush ? 0.38 : 0.16);

  return (
    <svg viewBox="0 0 200 248" className="h-full w-full" aria-hidden>
      <ellipse cx="100" cy="236" rx="42" ry="7" fill="#e4e4e7" />
      <rect x="78" y="196" width="18" height="22" rx="9" fill={skin} stroke={LINE} strokeWidth="2" />
      <rect x="104" y="196" width="18" height="22" rx="9" fill={skin} stroke={LINE} strokeWidth="2" />
      <rect x="74" y="214" width="24" height="11" rx="5.5" fill={LINE} />
      <rect x="102" y="214" width="24" height="11" rx="5.5" fill={LINE} />
      <ShirtBody shirt={outfit.shirt} skin={skin} back={back} />
      <rect x="88" y="122" width="24" height="16" rx="8" fill={skin} stroke={LINE} strokeWidth="2" />
      <HairBack style={outfit.hair} color={hair} />
      <ellipse cx="54" cy="92" rx="9" ry="13" fill={skin} stroke={LINE} strokeWidth="2" />
      <ellipse cx="146" cy="92" rx="9" ry="13" fill={skin} stroke={LINE} strokeWidth="2" />
      <ellipse
        cx="100"
        cy="88"
        rx="50"
        ry="54"
        fill={skin}
        stroke={LINE}
        strokeWidth="2.6"
      />
      <ellipse cx="80" cy="70" rx="14" ry="8" fill="#fff" opacity="0.28" />
      {back ? (
        <g>
          <ellipse cx="100" cy="72" rx="46" ry="40" fill={hair} />
          {outfit.hair === "ponytail" ? (
            <path d="M112 68 Q150 100 138 168 Q122 136 108 88" fill={hair} />
          ) : null}
          {outfit.hair === "long" ? (
            <>
              <path d="M50 88 C46 130 54 172 68 192 Q88 168 90 120 L82 90 Z" fill={hair} />
              <path d="M150 88 C154 130 146 172 132 192 Q112 168 110 120 L118 90 Z" fill={hair} />
            </>
          ) : null}
          {outfit.hair === "bun" ? (
            <circle cx="100" cy="22" r="18" fill={hair} />
          ) : null}
        </g>
      ) : null}
      {back ? null : (
        <g>
          <ellipse cx="70" cy="106" rx="10" ry="7" fill={cheek} />
          <ellipse cx="130" cy="106" rx="10" ry="7" fill={cheek} />
          <Brows kind={outfit.brows} />
          <Eyes kind={outfit.eyes} glasses={outfit.glasses} />
          <path d="M100 96 L100 105" stroke="#c0846a" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="100" cy="105" rx="3.6" ry="2.5" fill="#c0846a" opacity="0.5" />
          <Mouth kind={outfit.mouth} />
          <HairFront style={outfit.hair} color={hair} />
          <Glasses kind={outfit.glasses} />
        </g>
      )}
      <g transform={`translate(${outfit.hatOffsetX ?? 0} ${outfit.hatOffsetY ?? 0})`}>
        <Hat kind={outfit.hat} back={back} />
      </g>
    </svg>
  );
}
