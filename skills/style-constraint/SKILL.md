---
name: style-constraint
description: Generate a fixed-format Chinese cinematography specification from one or more reference images. Use when the user wants reference-driven capture style, lens and spatial rendering, image texture, cinematic color design, tone, palette, lighting feedback, exposure, or video cinematography while preserving a mandatory set of quality, skin, subtitle, motion, music, and natural-sound phrases.
---

# 风格限定 Skill

Produce a reusable photography layer, not scene content. Preserve the user's subject, setting, action, wardrobe, props, and narrative without inventing replacements.

## Required references

Read all three files completely before writing an output:

- `references/fixed-output.md`: mandatory phrases and the two-paragraph output contract.
- `references/reference-analysis.md`: reference-image analysis and dynamic writing rules.
- `references/color-cinema-language.md`: cinematic color naming, color structure, and lighting-response guidance.

## Workflow

1. Inspect every supplied reference image directly. Separate photographic treatment from depicted content.
2. Infer only visible or defensible properties: capture format, lens character, perspective, composition, spatial depth, texture, tonal curve, palette, cinematic color relationship, exposure, key direction, softness, color temperature, key-to-fill relationship, highlight behavior, shadow detail, and atmosphere.
3. Use the most recent reference as the primary look. Use older references only for traits the user explicitly asks to combine. Resolve conflicting references only when the intended blend is genuinely ambiguous.
4. Build paragraph 1 dynamically from the reference while including every mandatory phrase verbatim.
5. Build paragraph 2 dynamically from the reference's tone, cinematic color design, motivated lighting, lighting response, and exposure.
6. Do not copy the reference's people, objects, wardrobe, location, action, or story unless explicitly requested.
7. Return exactly two Chinese bracketed paragraphs in the required order. Add no preface, explanation, bullet list, headings, alternatives, or commentary.

## Priority and constraints

- Treat the mandatory phrase list as immutable; treat all surrounding wording as reference-dependent.
- Never force `VistaVision`, IMAX, 35mm, a camera brand, anamorphic optics, a focal length, an era, grain, halation, strong rim light, side light, backlight, or any named filmmaker unless the reference or user supports it.
- Let paragraph 1 adapt capture style, composition, spatial rendering, lens behavior, detail response, texture, and photographic character.
- Let paragraph 2 adapt tone, palette, color hierarchy, color contrast, emotional color effect, motivated source, light direction and softness, color temperature, colored-light response, contrast ratio, exposure, and material response.
- Distinguish color grading from physical lighting. Do not claim that a graded hue is an on-set colored source unless the reference shows a motivated emitter or colored bounce.
- Treat numeric values as practical visual specifications, not claims about original metadata. Use `约`, `接近`, `大致`, or ranges when inferred.
- Keep both paragraphs detailed but proportional. Avoid adjective chains, repeated prestige words, and scene details that compete with later generation content.
- Give four representative hex colors in this order: deep shadow, midtone, highlight, restrained skin tone. If no person is present, label the fourth value as the primary subject/material tone.
- If no reference image is available, ask for one. Do not invent reference-specific treatment.

