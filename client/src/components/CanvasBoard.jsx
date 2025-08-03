// components/CanvasBoard.jsx
import React, { useEffect, useRef } from "react";

const CanvasBoard = ({ canvasRef, isHost, startDrawing, draw, endDrawing }) => {
  const contextRef = useRef(null); // This is local to the canvas

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;

    contextRef.current = ctx;
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-black rounded-xl w-full h-full"
      onMouseDown={(e) => isHost && startDrawing(e)}
      onMouseMove={(e) => isHost && draw(e)}
      onMouseUp={(e) => isHost && endDrawing(e)}
      onMouseLeave={(e) => isHost && endDrawing(e)}
    />
  );
};

export default CanvasBoard;
