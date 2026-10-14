/* a blurred-foliage picture made of soft blobs: under MediaFrame's blur and
   lines it reads as an out-of-focus photo, with no image file to ship */
export function Foliage() {
  const blobs: [number, number, number, string][] = [
    [80, 60, 120, "#2f4a35"], [260, 40, 150, "#d9e4e8"], [180, 200, 140, "#4f6b4a"],
    [40, 300, 130, "#9fb7c4"], [300, 280, 160, "#26392b"], [150, 360, 120, "#e8efe9"],
    [330, 150, 90, "#6d8a62"], [60, 180, 70, "#c9d8de"],
  ];
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="400" fill="#7f9a8a" />
      {blobs.map(([x, y, r, c], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.55} fill={c} transform={`rotate(${-35 + i * 9} ${x} ${y})`} />
      ))}
    </svg>
  );
}
