export const METAL_RIM_STOP_LIMIT = 8;

export const METAL_RIM_SHADER = `
uniform float2 u_resolution;
uniform float u_time;

uniform float4 u_colors[8];

uniform float4 u_shape;

uniform float4 u_pattern;

uniform float4 u_surface;

uniform float3 u_light;

const float SHADER_TAU = 6.283185307179586;

float3 wrap289_3(float3 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

float2 wrap289_2(float2 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

float3 hashPermute(float3 value) {
  return wrap289_3(((value * 34.0) + 1.0) * value);
}

float simplexNoise(float2 point) {
  const float4 noiseConstants = float4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  float2 cell = floor(point + dot(point, noiseConstants.yy));

  float2 local = point - cell + dot(cell, noiseConstants.xx);

  float2 offset = local.x > local.y ? float2(1.0, 0.0) : float2(0.0, 1.0);

  float4 corners = local.xyxy + noiseConstants.xxzz;

  corners.xy -= offset;

  cell = wrap289_2(cell);

  float3 permutation = hashPermute(
    hashPermute(cell.y + float3(0.0, offset.y, 1.0)) +
    cell.x +
    float3(0.0, offset.x, 1.0)
  );

  float3 attenuation = max(
    0.5 - float3(
      dot(local, local),
      dot(corners.xy, corners.xy),
      dot(corners.zw, corners.zw)
    ),
    0.0
  );

  attenuation *= attenuation;
  attenuation *= attenuation;

  float3 gradientValue = 2.0 * fract(permutation * noiseConstants.www) - 1.0;

  float3 gradientHeight = abs(gradientValue) - 0.5;

  float3 gradientOffset = floor(gradientValue + 0.5);

  float3 gradientBase = gradientValue - gradientOffset;

  attenuation *= 1.79284291400159 - 0.85373472095314 * (
    gradientBase * gradientBase + gradientHeight * gradientHeight
  );

  float3 gradient;

  gradient.x = gradientBase.x * local.x + gradientHeight.x * local.y;

  gradient.yz = gradientBase.yz * corners.xz + gradientHeight.yz * corners.yw;

  return 130.0 * dot(attenuation, gradient);
}

float4 palette(float t) {
  float count = max(u_pattern.x, 2.0);

  float position = clamp(t, 0.0, 1.0) * (count - 1.0);

  float index = floor(position);

  float mixAmount = position - index;

  float sharpness = max(u_pattern.z, 0.001);

  mixAmount = clamp((mixAmount - 0.5) * sharpness + 0.5, 0.0, 1.0);

  mixAmount = mixAmount * mixAmount * (3.0 - 2.0 * mixAmount);

  float4 from = u_colors[0];
  float4 to = u_colors[0];

  for (int stop = 0; stop < 8; stop++) {
    if (float(stop) >= count) {
      break;
    }

    if (float(stop) == index) {
      from = u_colors[stop];
    }

    if (float(stop) == index + 1.0) {
      to = u_colors[stop];
    }
  }

  return mix(from, to, mixAmount);
}

float roundedBox(float2 point, float2 halfSize, float radius) {
  radius = clamp(radius, 0.0, min(halfSize.x, halfSize.y));

  float2 q = abs(point) - halfSize + radius;

  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

half4 main(float2 fragCoord) {
  float thickness = max(u_shape.x, 0.5);
  float softness = max(u_shape.z, 0.001);
  float bleed = u_light.z;

  float2 center = u_resolution * 0.5;

  float2 point = fragCoord - center;

  float2 halfSize = max(center - bleed - thickness * 0.5, float2(0.5));

  float distance = roundedBox(
    point,
    halfSize,
    u_shape.y - thickness * 0.5
  );

  float across = clamp(distance / thickness + 0.5, 0.0, 1.0);

  float2 normalized = point / halfSize;

  float along = atan(normalized.y, normalized.x) / SHADER_TAU + 0.5;

  float distortion = u_surface.x;
  float noiseScale = max(u_surface.y, 0.001);

  float rimNoise = simplexNoise(
    float2(along * 3.0 * noiseScale, u_time * 0.35)
  );

  float bodyNoise = simplexNoise(
    normalized * 2.0 * noiseScale + u_time * 0.2
  );

  float sweep = (along + u_pattern.w / SHADER_TAU) * u_pattern.y;

  sweep += u_time * 0.5;

  sweep += (rimNoise * 0.35 + bodyNoise * 0.65) * distortion;

  sweep += (across - 0.5) * 0.6;

  float ramp = abs(fract(sweep) * 2.0 - 1.0);

  float4 sampled = palette(ramp);

  float3 color = sampled.rgb;

  float micro = abs(fract(sweep * 3.0 + bodyNoise * 0.4) * 2.0 - 1.0);

  color *= 0.88 + 0.24 * micro;

  float curve = 1.0 - abs(across * 2.0 - 1.0);

  color *= mix(1.0, 0.3 + 0.7 * pow(curve, 0.45), u_surface.z);

  float sheenPhase = fract(along - u_time * 0.12);

  float sheenDistance = min(sheenPhase, 1.0 - sheenPhase);

  color += exp(-sheenDistance * sheenDistance * 400.0) *
    u_light.x *
    (0.55 + 0.45 * curve);

  color = pow(max(color, float3(0.0)), float3(max(u_surface.w, 0.001)));

  color = clamp(color, 0.0, 1.0);

  float band = 1.0 - smoothstep(
    thickness * 0.5 - softness,
    thickness * 0.5 + softness,
    abs(distance)
  );

  float glowStrength = u_light.y;

  float glowRadius = max(thickness * 3.0, 6.0);

  float glowFalloff = clamp(
    1.0 - max(distance - thickness * 0.5, 0.0) / glowRadius,
    0.0,
    1.0
  );

  float glow = glowStrength *
    glowFalloff * glowFalloff *
    step(0.0, distance);

  float alpha = clamp(band + glow, 0.0, 1.0) * u_shape.w * sampled.a;

  color *= alpha;

  return half4(half3(color), half(alpha));
}
`;
