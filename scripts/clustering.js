export function clusterPoints(points, threshold) {
  const clusters = [];
  const visited = new Set();

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [];
    const queue = [i];
    visited.add(i);

    while (queue.length) {
      const idx = queue.pop();
      const p = points[idx];
      cluster.push(p);

      for (let j = 0; j < points.length; j++) {
        if (visited.has(j)) continue;
        if (dist(p, points[j]) <= threshold) {
          visited.add(j);
          queue.push(j);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters.map(cluster => {
    const cx = cluster.reduce((s, p) => s + p.x, 0) / cluster.length;
    const cy = cluster.reduce((s, p) => s + p.y, 0) / cluster.length;
    return { x: cx, y: cy, size: cluster.length };
  });
}