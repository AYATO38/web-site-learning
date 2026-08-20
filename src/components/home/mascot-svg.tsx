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

function HairBack({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "bald") return null;
  if (style === "ponytail") {
    return (
      <g>
        <ellipse cx="100" cy="64" rx="46" ry="32" fill={color} stroke={LINE} strokeWidth="2.2" />
        <path
          d="M128 78 Q164 92 152 148 Q138 126 124 92"
          fill={color}
          stroke={LINE}
          strokeWidth="2.2"
        />
        <circle cx="148" cy="148" r="8" fill={color} stroke={LINE} strokeWidth="2" />
      </g>
    );
  }
  if (style === "bun") {
    return (
      <g>
        <ellipse cx="100" cy="66" rx="44" ry="30" fill={color} stroke={LINE} strokeWidth="2.2" />
        <circle cx="100" cy="32" r="17" fill={color} stroke={LINE} strokeWidth="2.2" />
        <circle cx="100" cy="32" r="7" fill="#fff" opacity="0.16" />
      </g>
    );
  }
  if (style === "curly") {
    return (
      <g stroke={LINE} strokeWidth="2">
        <circle cx="66" cy="60" r="17" fill={color} />
        <circle cx="86" cy="42" r="18" fill={color} />
        <circle cx="114" cy="40" r="19" fill={color} />
        <circle cx="134" cy="60" r="17" fill={color} />
        <circle cx="72" cy="82" r="15" fill={color} />
        <circle cx="128" cy="82" r="15" fill={color} />
        <circle cx="100" cy="48" r="16" fill={color} />
      </g>
    );
  }
  if (style === "messy") {
    return (
      <path
        d="M54 88 L58 46 L76 60 L88 30 L102 50 L116 26 L132 54 L148 38 L148 88 Q100 50 54 88 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    );
  }
  return (
    <ellipse
      cx="100"
      cy="64"
      rx="48"
      ry="34"
      fill={color}
      stroke={LINE}
      strokeWidth="2.2"
    />
  );
}

function HairFront({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "bald" || style === "bun") return null;
  if (style === "side") {
    return (
      <path
        d="M56 80 Q84 48 132 72 Q108 62 78 88 Q62 94 56 80 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2"
      />
    );
  }
  if (style === "messy") {
    return (
      <path
        d="M60 82 Q86 56 116 74 Q98 64 72 90 Z"
        fill={color}
        stroke={LINE}
        strokeWidth="2"
      />
    );
  }
  if (style === "curly") {
    return (
      <g>
        <circle cx="80" cy="72" r="11" fill={color} stroke={LINE} strokeWidth="1.8" />
        <circle cx="100" cy="66" r="10" fill={color} stroke={LINE} strokeWidth="1.8" />
        <circle cx="120" cy="72" r="11" fill={color} stroke={LINE} strokeWidth="1.8" />
      </g>
    );
  }
  return (
    <path
      d="M56 78 Q100 48 144 78 Q122 66 100 72 Q78 66 56 78 Z"
      fill={color}
      stroke={LINE}
      strokeWidth="2"
    />
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
          d="M56 72 Q100 26 144 72 L146 80 Q100 58 54 80 Z"
          fill="#3b9eff"
          stroke={LINE}
          strokeWidth="2.2"
        />
        <ellipse cx="100" cy="78" rx="48" ry="8" fill="#2563eb" />
        <rect
          x={back ? 40 : 126}
          y="74"
          width="32"
          height="8"
          rx="4"
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
          d="M56 80 Q100 22 144 80 Q100 62 56 80 Z"
          fill="#be123c"
          stroke={LINE}
          strokeWidth="2.2"
        />
        <ellipse cx="100" cy="80" rx="44" ry="8" fill="#9f1239" />
        <circle cx="100" cy="28" r="9" fill="#fda4af" stroke={LINE} strokeWidth="2" />
      </g>
    );
  }
  if (kind === "headphones") {
    return (
      <g>
        <path
          d="M58 80 Q100 34 142 80"
          fill="none"
          stroke={LINE}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="46" y="78" width="18" height="30" rx="9" fill={LINE} />
        <rect x="136" y="78" width="18" height="30" rx="9" fill={LINE} />
        <rect x="50" y="84" width="10" height="18" rx="5" fill="#3b9eff" />
        <rect x="140" y="84" width="10" height="18" rx="5" fill="#3b9eff" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M116 40 Q132 22 150 42 Q136 36 128 50 Z"
        fill="#fb7185"
        stroke={LINE}
        strokeWidth="2"
      />
      <path
        d="M132 22 Q142 6 156 26 Q144 20 138 34 Z"
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
      {back && outfit.hair !== "bald" ? (
        <g>
          <ellipse cx="100" cy="78" rx="42" ry="34" fill={hair} />
          {outfit.hair === "ponytail" ? (
            <path d="M108 72 Q138 98 124 156 Q110 128 100 92" fill={hair} />
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
      <Hat kind={outfit.hat} back={back} />
    </svg>
  );
}
