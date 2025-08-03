const CanvasBoard = ({ canvasRef, isHost, startDrawing, draw, endDrawing }) => {
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-white cursor-crosshair"
      onMouseDown={(e) => isHost && startDrawing(e)}
      onMouseMove={(e) => isHost && draw(e)}
      onMouseUp={(e) => isHost && endDrawing(e)}
      onMouseLeave={(e) => isHost && endDrawing(e)}
    />
  );
};

export default CanvasBoard;
