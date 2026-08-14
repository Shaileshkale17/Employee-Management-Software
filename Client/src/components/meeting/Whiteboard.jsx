import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const COLORS = ["#1e293b", "#3354F4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ffffff"];
const SIZES = [2, 4, 8];

const Whiteboard = ({ socket, meetingId }) => {
  const isDark = useSelector((state) => state.theme?.mode === "dark");
  const defaultColor = isDark ? "#e2e8f0" : COLORS[0];
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const colorRef = useRef(defaultColor);
  const sizeRef = useRef(SIZES[1]);

  const [color, setColor] = useState(defaultColor);
  const [size, setSize] = useState(SIZES[1]);
  const [tool, setTool] = useState("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onStroke = (data) => {
      const ctx = ctxRef.current;
      if (!ctx || !data) return;
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.beginPath();
      ctx.moveTo(data.prev.x, data.prev.y);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    };
    const onClear = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    socket.on("meeting:whiteboard:stroke", onStroke);
    socket.on("meeting:whiteboard:clear", onClear);
    return () => {
      socket.off("meeting:whiteboard:stroke", onStroke);
      socket.off("meeting:whiteboard:clear", onClear);
    };
  }, [socket]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawLine = (prev, cur, emit = true) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = sizeRef.current;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    if (emit && socket) {
      socket.emit("meeting:whiteboard:stroke", {
        meetingId,
        prev,
        x: cur.x,
        y: cur.y,
        color: colorRef.current,
        size: sizeRef.current,
      });
    }
  };

  const start = (e) => {
    e.preventDefault();
    if (tool !== "pen") return;
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
  };

  const move = (e) => {
    if (!drawingRef.current || !lastPosRef.current) return;
    e.preventDefault();
    const cur = getPos(e);
    drawLine(lastPosRef.current, cur);
    lastPosRef.current = cur;
  };

  const end = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket?.emit("meeting:whiteboard:clear", { meetingId });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-200/60 px-3 py-2">
        <span className="text-sm font-semibold text-ink-800">Whiteboard</span>
        <div className="ml-1 flex items-center gap-1">
          <button
            onClick={() => setTool("pen")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              tool === "pen" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-100/70"
            }`}>
            Pen
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              tool === "eraser" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-100/70"
            }`}>
            Eraser
          </button>
        </div>
        <div className="ml-2 flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                colorRef.current = c;
              }}
              className={`h-6 w-6 rounded-full ring-2 transition-transform hover:scale-110 ${
                color === c ? "ring-brand-500" : "ring-ink-200/60"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <div className="ml-2 flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSize(s);
                sizeRef.current = s;
              }}
              className={`rounded-full transition-colors ${
                size === s ? "bg-ink-200/80" : "hover:bg-ink-100"
              }`}
              aria-label={`Size ${s}`}>
              <span className="mx-2 inline-block rounded-full bg-ink-700" style={{ width: s * 2, height: s * 2 }} />
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={clearBoard}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
            Clear
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className={`h-full w-full touch-none ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
