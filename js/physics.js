export const BOUNCE_VELOCITY = 500; // base upward velocity on bounce (px/s)

// Returns gravity (px/s^2) for a given depth in meters
export function getGravity(depthMeters) {
  // Starts at 600, increases to 1800 by inner core
  const base = 600;
  const max = 1800;
  const ramp = Math.min(depthMeters / 3000, 1); // 0..1 over 3000m
  return base + (max - base) * ramp;
}

// Depth in meters from world Y position
// 1 world pixel = 0.5 meters (so 2000px = 1000m)
export const PIXELS_PER_METER = 2;

export function depthToMeters(worldY) {
  return Math.max(0, worldY * (1 / PIXELS_PER_METER));
}

// Check ball against all platforms, return the one it lands on (or null)
export function findLandingPlatform(ball, platforms, dt) {
  if (ball.vy <= 0) return null; // only when falling

  const ballBottom = ball.y + ball.radius;
  const prevBallBottom = ballBottom - ball.vy * dt;

  let landed = null;
  let closestY = Infinity;

  for (const p of platforms) {
    if (!p.alive) continue;

    // Ball bottom crossed platform top this frame
    if (prevBallBottom <= p.y && ballBottom >= p.y) {
      // Horizontal overlap
      if (ball.x + ball.radius > p.x && ball.x - ball.radius < p.x + p.width) {
        if (p.y < closestY) {
          closestY = p.y;
          landed = p;
        }
      }
    }
  }

  return landed;
}
