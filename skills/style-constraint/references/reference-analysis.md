# Reference-image analysis

## Separate style from content

Extract photography and grading only. Ignore identity, pose, action, wardrobe, props, architecture, location, weather, and story unless the user asks to transfer them. Mention weather only when it physically causes the lighting treatment.

## Paragraph 1 analysis

Analyze and dynamically describe:

1. **Capture character**: large-format, 35mm-like, digital cinema, anamorphic, documentary, polished commercial, archival, or another defensible visual character. Do not claim actual equipment metadata.
2. **Composition and space**: frame stability, symmetry or imbalance, negative space, foreground occlusion, depth layering, scale, compression, and subject-environment separation.
3. **Lens behavior**: inferred wide/normal/telephoto perspective, compression or expansion, depth of field, focus falloff, distortion, and edge behavior. Do not combine incompatible lens claims without visible justification.
4. **Texture and detail**: sharpness, microcontrast, grain or clean digital response, halation, diffusion, density, clarity, moisture, skin, fabric, metal, glass, haze, and other visible material response.

Include every mandatory phrase from `fixed-output.md`, but make the rest of paragraph 1 specific to the current reference. Never default to VistaVision or strong studio lighting.

## Paragraph 2 analysis

Analyze in this order:

1. **Tone and exposure**: high-key/low-key, exposure bias, black floor, contrast curve, highlight roll-off, shadow retention, dynamic range.
2. **Cinematic color identity**: choose one precise Chinese color-look name supported by the reference, optionally followed by a broader grade family. Avoid a generic base-color label when a more specific material, climate, era, or cinematic name is defensible.
3. **Color hierarchy**: identify dominant, supporting, and limited accent colors; state where each sits in shadows, midtones, highlights, background, practicals, reflections, or atmosphere.
4. **Color relationship**: identify complementary, analogous, split-complementary, warm-cool, saturation, or luminance contrast. Explain the restrained emotional and cinematic effect without adding plot.
5. **Palette values**: select four plausible RGB hex values for deep shadow, midtone, highlight, and restrained skin/material. Do not claim pixel-perfect sampling.
6. **Lighting**: identify motivated source, environmental basis, key direction and elevation, apparent source size, softness, color temperature, fill level, stop difference, contrast ratio, shadow edge, and rim/backlight presence.
7. **Color-light response**: state how key, ambient/fill, rim/accent, reflections, speculars, haze, and volumetric light carry or resist the palette. Distinguish a physical colored emitter from a post-production grade.
8. **Atmosphere**: state the emotional result in one restrained clause without adding plot.

## Dynamic paragraph requirements

- Start with `光影氛围：`.
- Name the lighting look first in Chinese and then concise professional English in parentheses.
- Name the cinematic color look; do not merely say `冷色调`, `暖色调`, or `电影感`.
- State dominant, supporting, and accent colors with tonal or spatial placement and their color-contrast relationship.
- Give four `#RRGGBB` values: deep shadow, midtone, highlight, and restrained skin/material.
- State the physical or environmental source, direction, elevation, spread, softness, directionality, and inferred color temperature.
- Add lighting feedback: how key light, ambient/fill, rim/accent, reflections/speculars, and atmosphere should reproduce the palette.
- State how light models the face. If no face is visible, describe primary-subject planes, edges, and material texture.
- State key-to-fill difference in stops or an approximate bright-to-shadow relationship, then give a practical contrast-ratio range.
- State shadow-edge quality and whether rim/backlight is absent, subtle, or pronounced.
- End with exposure placement, highlight behavior, shadow behavior, retained textures, and protection from flat single-color washing.

## Accuracy rules

- Do not present camera metadata as factual unless supplied.
- Keep inferred angles, Kelvin values, stops, ratios, lens behavior, palette, and lighting internally consistent.
- Do not describe a colored key, fill, or rim unless the reference visibly supports that physical light or bounce.
- Do not describe both pronounced rim lighting and no visible rim light.
- Do not force face-specific dynamic analysis when no face is visible.
- Do not assign every visible color equal weight. Use one dominant, one support, and at most one or two restrained accents.
- Do not let stylized color contaminate skin uniformly; preserve readable skin unless the reference clearly uses intentional monochromatic or fantasy lighting.
- Do not include generation-engine syntax, model names, negative prompts, subtitles, music, or camera movement in paragraph 2.

## Calibration example for paragraph 2

```text
【光影氛围：电影级阴雨天侧前方漫射柔光（Cool Overcast Side-Front Key），低饱和雾霾蓝灰底片调色，以深青灰压入暗部为主色、雾蓝灰承接环境与中间调为辅色、极少量克制暖肤色为视觉强调，形成低饱和冷暖微差与低明度层次带来的疏离、压抑和写实电影感；代表性色值为（深暗部#20282A + 冷灰中调#5D696A + 雾蓝亮部#AAB5B6 + 克制肤色#9A8377）。厚重雨云覆盖天空，天空作为巨大柔光箱，从人物前侧上方约30°—45°提供宽阔、均匀而有轻微方向性的冷色自然光，色温约6500K—7000K；色彩与布光联动表现为冷灰主光统一人物与环境、略深的青灰环境填充维持阴影色彩、无额外彩色轮廓光，潮湿表面仅反射少量雾蓝高光。面部受光柔和，额头、眼睛、鼻梁和颧骨保持清晰，脸颊凹陷处有阴影，背光侧只比受光侧低约1—1.5档，整体光比控制在4:1—8:1。阴影边缘极其柔软，不出现硬鼻影、强烈明暗分割或明显轮廓光。整体曝光较普通阴天压低约半档，天空有层次而非纯白，亮部清透但不发亮，暗部沉静但保留头发、衣物褶皱、潮湿地面纹理和背景结构，避免全画面单色覆盖并保持主体与肤色可读性。】
```

