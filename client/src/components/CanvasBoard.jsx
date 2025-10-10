// CanvasBoard.jsx
import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";
import { throttle } from "../utils/throttle";

/**
 * CanvasBoard
 * - unchanged drawing / resize / snapshot logic
 * - accepts `overlayActive` prop (default false)
 *   when overlayActive is true, the canvas sets pointerEvents: 'none'
 *   so overlay controls can receive clicks.
 */
const CanvasBoard = ({ overlayActive = false }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const snapshotTimerRef = useRef(null);
  const throttledEmitRef = useRef(null);

  const roomCode = useUserStore((s) => s.roomCode);
  const canDraw = useUserStore((s) => s.canDraw);
  const [isDrawing, setIsDrawing] = useState(false);

  // Resize helper that preserves the canvas content
  const resizeCanvasToParent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(parent.clientWidth));
    const height = Math.max(1, Math.floor(parent.clientHeight));

    // Preserve current content by taking a dataURL snapshot
    let snapshotData = null;
    try {
      snapshotData = canvas.toDataURL("image/png");
    } catch (err) {
      snapshotData = null;
    }

    // Set internal buffer to device pixels
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Set CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    // Reset transforms and scale for DPR
    if (typeof ctx.setTransform === "function") {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      ctx.scale(dpr, dpr);
    }

    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    contextRef.current = ctx;

    // Restore snapshot if available
    if (snapshotData) {
      const img = new Image();
      img.onload = () => {
        try {
          // draw the image into CSS pixel space (user space)
          ctx.drawImage(img, 0, 0, width, height);
        } catch (err) {
          console.warn("Failed to restore canvas snapshot:", err);
        }
      };
      img.src = snapshotData;
    }

    // After resizing, request a fresh snapshot from the current drawer (if not the drawer)
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
    }
    snapshotTimerRef.current = setTimeout(() => {
      if (roomCode) {
        socket.emit("request_canvas_snapshot", { roomCode });
      }
      snapshotTimerRef.current = null;
    }, 150);
  };

  useLayoutEffect(() => {
    // initial sizing + setup ResizeObserver to watch parent element size changes
    resizeCanvasToParent();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      resizeCanvasToParent();
    });
    resizeObserverRef.current.observe(parent);

    const onWindowResize = () => resizeCanvasToParent();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map mouse coords to canvas-local coords (CSS px)
  const getCoords = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // initialize throttled emitter (30 FPS ~ 33ms)
  useEffect(() => {
    throttledEmitRef.current = throttle((x, y) => {
      if (!roomCode) return;
      socket.emit("drawing", { roomCode, x, y });
    }, 33);

    return () => {
      if (throttledEmitRef.current && throttledEmitRef.current.cancel) {
        throttledEmitRef.current.cancel();
      }
    };
  }, [roomCode]);

  const startDrawing = (e) => {
    if (!canDraw) return;
    const ev = e.nativeEvent || e;
    const { x, y } = getCoords(ev);
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    socket.emit("beginPath", { roomCode, x, y });
  };

  const draw = (e) => {
    if (!canDraw || !isDrawing) return;
    const ev = e.nativeEvent || e;
    const { x, y } = getCoords(ev);
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (throttledEmitRef.current) {
      throttledEmitRef.current(x, y);
    }
  };

  const stopDrawing = () => {
    if (!canDraw) return;
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    socket.emit("endPath", { roomCode });
  };

  // Respond to server requests and incoming snapshots
  useEffect(() => {
    socket.on("request_canvas_snapshot_to_drawer", ({ requesterId }) => {
      if (!canDraw) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const dataURL = canvas.toDataURL("image/png");
        socket.emit("canvas_snapshot", {
          roomCode,
          targetId: requesterId,
          dataURL,
        });
      } catch (err) {
        console.warn("Failed to capture canvas snapshot:", err);
      }
    });

    socket.on("canvas_snapshot", ({ dataURL }) => {
      if (!dataURL) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        try {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          ctx.drawImage(img, 0, 0, width, height);
        } catch (err) {
          console.warn("Error drawing canvas snapshot:", err);
        }
      };
      img.src = dataURL;
    });

    return () => {
      socket.off("request_canvas_snapshot_to_drawer");
      socket.off("canvas_snapshot");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDraw, roomCode]);

  // socket listeners for real-time drawing (existing)
  useEffect(() => {
    socket.on("beginPath", ({ x, y }) => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x, y);
    });
    socket.on("drawing", ({ x, y }) => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    });
    socket.on("endPath", () => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.closePath();
    });
    socket.on("clear_canvas", () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    });

    return () => {
      socket.off("beginPath");
      socket.off("drawing");
      socket.off("endPath");
      socket.off("clear_canvas");
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className="absolute inset-0 block bg-white"
      style={{
        cursor: canDraw ? "crosshair" : "not-allowed",
        zIndex: 10,
        // If overlay is active, allow overlay to receive pointer events
        pointerEvents: overlayActive ? "none" : "auto",
      }}
    />
  );
};

export default CanvasBoard;
