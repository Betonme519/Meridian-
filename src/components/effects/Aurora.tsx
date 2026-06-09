import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

import "./Aurora.css";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uIntro;
uniform vec3 uRipple;   // (cx, cy 归一化, age 0→1 有效 / >1 无效)

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;     // uv.y = 0 在底部（GL 约定）
  // 竖向翻转：极光硬边落在底部、模糊朝上（替代原来的 CSS rotate-180）
  vec2 fuv = vec2(uv.x, 1.0 - uv.y);

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, fuv.x, rampColor);

  float height = snoise(vec2(fuv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (fuv.y * 2.0 - height + 0.2);
  // 入场期只把中间（黄色，fuv.x≈0.5）抬到顶峰，两侧（橙/蓝）保持低；随 uIntro 渐隐回正常起伏。
  height += (1.0 - uIntro) * 0.7 * exp(-pow((fuv.x - 0.5) * 3.0, 2.0));
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  // 颜色加下限（0.6~1.0），边缘也显示真实色相、不发黑。
  vec3 auroraColor = rampColor * (0.6 + 0.4 * clamp(intensity, 0.0, 1.0));

  // 颗粒感：高频 hash 噪声叠在颜色上（仅有 alpha 处可见）。
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 8.0) * 43758.5453);
  auroraColor += (grain - 0.5) * 0.09;

  // ── 入场（uIntro 0→1）：从底部中心向上 + 四周扩散，呈宽半圆穹顶 ──
  // 原点 = 底部中心 (0.5, 0)。水平方向用 aspect*0.7 弱化 → 半圆更宽更扁：
  // 中间先升到顶、完全透出，两边来得更慢、前沿更低（穹顶弧线）。
  float aspect = uResolution.x / uResolution.y;
  vec2 d = vec2((uv.x - 0.5) * aspect * 0.7, uv.y);
  float dist = length(d);

  // 水波纹：沿扩散半径方向的正弦起伏，相位随 uIntro 向外推 → 波纹朝外跑
  // 极轻微的前沿起伏（低频低幅）—— 只给一点有机感，不出明显水波纹路
  float ripple = sin(dist * 7.0 - uIntro * 22.0) * 0.012;
  float maxR = 2.4;
  float revealR = uIntro * maxR;
  // 过渡边界加宽（±0.32）→ 扩散前沿更柔、更糊、更宽，不再有硬线
  float reveal = 1.0 - smoothstep(revealR - 0.32, revealR + 0.32, dist + ripple);

  // 分离圆点点阵：圆点间有间隔；dotR 随 uIntro 由小(分离)长到大(填满) → 收敛为平滑
  float spacing = 7.0;
  vec2 g = fract(gl_FragCoord.xy / spacing) - 0.5;
  float dotR = mix(0.16, 0.62, uIntro);
  float dotShape = 1.0 - smoothstep(dotR - 0.10, dotR + 0.10, length(g));
  float dotMask = mix(dotShape, 1.0, uIntro);

  // 收尾阶段（uIntro→1）整体并回正常极光，消除任何残留遮罩
  float introMask = mix(reveal * dotMask, 1.0, smoothstep(0.9, 1.0, uIntro));

  float finalAlpha = auroraAlpha * introMask;

  // 点击像素荡漾：从点击点扩散的一圈点阵波纹，短暂出现后消退；只叠在极光上，
  // 不重置 uIntro（极光本体照常播放）。uRipple.z>1 时无效。
  if (uRipple.z <= 1.0) {
    float raspect = uResolution.x / uResolution.y;
    vec2 rd = vec2((uv.x - uRipple.x) * raspect, uv.y - uRipple.y);
    float rdist = length(rd);
    float ringR = uRipple.z * 1.7;                          // 环带半径随时间扩散
    float ring = exp(-pow((rdist - ringR) / 0.24, 2.0));    // 高斯环带（更宽一档）
    float influence = ring * (1.0 - uRipple.z);             // 随时间消退
    vec2 rg = fract(gl_FragCoord.xy / 6.0) - 0.5;
    float rdots = 1.0 - smoothstep(0.16, 0.30, length(rg));  // 分离点阵
    finalAlpha = mix(finalAlpha, finalAlpha * rdots, influence); // 环带内打散成像素
    auroraColor += influence * 0.05;                        // 极轻微提亮（少一点白）
  }

  fragColor = vec4(auroraColor * finalAlpha, finalAlpha);
}
`;

// 入场动画时长：从底部中心点阵铺开、水波纹扩散、收敛为平滑极光。
const INTRO_DURATION_MS = 2600;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  /** 点击界面时传入：客户端坐标 + 递增 key；key 变化即从该点放一次像素荡漾波纹（不影响极光播放） */
  ripple?: { x: number; y: number; key: number } | null;
}

// 点击波纹时长（短促）。
const RIPPLE_DURATION_MS = 900;

/**
 * Aurora —— WebGL（ogl）极光背景效果。客户端 only：所有 GL 初始化在 useEffect 内，
 * SSR 阶段只渲染空 div，hydration 安全。容器宽高由父级决定（见 Aurora.css）。
 */
export default function Aurora(props: AuroraProps) {
  const { colorStops = ["#5227FF", "#7cff67", "#5227FF"], amplitude = 1.0, blend = 0.5 } = props;
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    let program: Program | undefined;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }
    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
        uIntro: { value: 0 },
        uRipple: { value: [0.5, 0.5, 2.0] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let animateId = 0;
    let introStart = 0;
    // 点击波纹状态：起始时间 + 归一化中心点
    let rippleStart = -1;
    let lastRippleKey = propsRef.current.ripple?.key ?? 0;
    let rcx = 0.5;
    let rcy = 0.5;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      if (program) {
        // 入场进度 uIntro 0→1（仅挂载时跑一次）：点阵铺开 → 扩散 → 收敛。easeOutCubic
        if (introStart === 0) introStart = t;
        const p = Math.min(1, (t - introStart) / INTRO_DURATION_MS);
        program.uniforms.uIntro.value = 1 - Math.pow(1 - p, 3);

        // 点击波纹：key 变化 → 用画布 rect 把客户端坐标转归一化（y 翻成 GL 朝上），起一段波纹
        const rp = propsRef.current.ripple;
        const rkey = rp?.key ?? 0;
        if (rp && rkey !== lastRippleKey) {
          lastRippleKey = rkey;
          const rect = gl.canvas.getBoundingClientRect();
          rcx = (rp.x - rect.left) / rect.width;
          rcy = 1 - (rp.y - rect.top) / rect.height;
          rippleStart = t;
        }
        const rage = rippleStart < 0 ? 2.0 : (t - rippleStart) / RIPPLE_DURATION_MS;
        program.uniforms.uRipple.value = [rcx, rcy, rage];

        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        const stops = propsRef.current.colorStops ?? colorStops;
        program.uniforms.uColorStops.value = stops.map((hex: string) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
        renderer.render({ scene: mesh });
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amplitude]);

  return <div ref={ctnDom} className="aurora-container" />;
}
