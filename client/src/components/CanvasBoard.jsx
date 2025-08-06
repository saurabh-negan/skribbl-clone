import React, { useRef, useEffect, useState } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";

const CanvasBoard = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const roomCode = useUserStore((s) => s.roomCode);
  const canDraw = useUserStore((s) => s.canDraw);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Get the CSS size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set internal pixel size for high-DPI
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Make it visually fill the parent
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    // Scale drawing operations to account for DPR
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4; // in CSS pixels now
    contextRef.current = ctx;
  }, []);

  const getCoords = (nativeEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: nativeEvent.clientX - rect.left,
      y: nativeEvent.clientY - rect.top,
    };
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!canDraw) return;
    const { x, y } = getCoords(nativeEvent);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    socket.emit("beginPath", { roomCode, offsetX: x, offsetY: y });
  };

  const draw = ({ nativeEvent }) => {
    if (!canDraw || !isDrawing) return;
    const { x, y } = getCoords(nativeEvent);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    socket.emit("drawing", { roomCode, x, y });
  };

  const stopDrawing = () => {
    if (!canDraw) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    socket.emit("endPath", { roomCode });
  };

  useEffect(() => {
    socket.on("beginPath", ({ offsetX, offsetY }) => {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    });
    socket.on("drawing", ({ x, y }) => {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    });
    socket.on("endPath", () => {
      contextRef.current.closePath();
    });
    return () => {
      socket.off("beginPath");
      socket.off("drawing");
      socket.off("endPath");
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className="w-full h-full border-0 block"
      style={{
        background: "white",
        cursor: canDraw ? "crosshair" : "not-allowed",
      }}
    />
  );
};

export default CanvasBoard;
