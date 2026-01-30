// Visual Plinko Path Recorder - Shows the recording simulation in real-time
import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { addPathsBatch, RecordedPath, Position } from './plinkoPathLibrary';

interface PlinkoRecorderProps {
  rows: 8 | 12 | 16;
  pathsPerBucket?: number;
  onComplete: () => void;
  onProgress: (progress: string) => void;
}
const WIDTH = 620;
const HEIGHT = 580;

const MULTIPLIERS: { [key: number]: number[] } = {
  8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
  16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
};

const PlinkoRecorder: React.FC<PlinkoRecorderProps> = ({ rows, pathsPerBucket = 6, onComplete, onProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runningRef = useRef(false);
  const animationIdRef = useRef<number>(0);
  const ballsPerSecondRef = useRef(50);
  const PATHS_PER_BUCKET = pathsPerBucket;
  
  const [status, setStatus] = useState('Starting...');
  const [bucketCounts, setBucketCounts] = useState<number[]>([]);
  const [ballsPerSecond, setBallsPerSecond] = useState(50);

  const bucketCount = rows + 1;
  const multipliers = MULTIPLIERS[rows];

  useEffect(() => {
    console.log('[Recorder] Component mounted, rows=', rows);
    
    // Reset state
    runningRef.current = false;
    setBucketCounts(new Array(bucketCount).fill(0));
    
    // Start after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startRecording();
    }, 200);

    return () => {
      console.log('[Recorder] Component unmounting');
      clearTimeout(timer);
      stopRecording();
    };
  }, [rows]);

  const stopRecording = () => {
    console.log('[Recorder] Stopping recording');
    runningRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
  };

  const startRecording = () => {
    console.log('[Recorder] startRecording called');
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[Recorder] Canvas not found!');
      setStatus('Error: Canvas not ready');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Recorder] Could not get 2D context!');
      setStatus('Error: No canvas context');
      return;
    }

    console.log('[Recorder] Canvas ready:', canvas.width, 'x', canvas.height);
    setStatus('Setting up physics...');

    // Constants
    const scale = rows === 8 ? 2.0 : rows === 12 ? 1.5 : 1.0;
    const PEG_RAD = 4 * scale;
    const BALL_RAD = 7 * scale;
    const margin = 20;
    const maxPegsInRow = rows + 2;
    const availableWidth = WIDTH - (margin * 2);
    const GAP = availableWidth / (maxPegsInRow - 1);
    const verticalGap = (HEIGHT - 80) / (rows + 1);

    // Bucket positions
    const bottomRowPegs = rows + 2;
    const bottomRowWidth = (bottomRowPegs - 1) * GAP;
    const pegStartX = (WIDTH - bottomRowWidth) / 2;
    const singleBucketWidth = GAP - 6;
    const bucketStartX = pegStartX + GAP / 2 - singleBucketWidth / 2;
    const bucketY = HEIGHT - 45;

    // Storage
    const recordedPaths: { [bucket: string]: RecordedPath[] } = {};
    for (let i = 0; i < bucketCount; i++) {
      recordedPaths[String(i)] = [];
    }
    const activeBalls = new Map<number, Position[]>();

    // Create engine
    const engine = Matter.Engine.create({ gravity: { scale: 0.001 } });
    engineRef.current = engine;

    // Create pegs
    const pegs: Matter.Body[] = [];
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * GAP;
      const startX = (WIDTH - rowWidth) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        const peg = Matter.Bodies.circle(
          startX + c * GAP,
          40 + verticalGap * (r + 1),
          PEG_RAD,
          { isStatic: true, label: 'Peg' }
        );
        pegs.push(peg);
      }
    }
    Matter.Composite.add(engine.world, pegs);

    // Create ground
    const ground = Matter.Bodies.rectangle(WIDTH / 2, bucketY - 5, WIDTH * 2, 10, {
      isStatic: true, label: 'Ground'
    });

    // Wall setup - same as main game
    const topRowPegs = 3;
    const topRowWidth = (topRowPegs - 1) * GAP;
    const topRowStartX = (WIDTH - topRowWidth) / 2;
    const topRowEndX = topRowStartX + topRowWidth;
    const topY = 40 + verticalGap;
    const bottomRowStartX = pegStartX;
    const bottomRowEndX = pegStartX + bottomRowWidth;
    const bottomY = 40 + verticalGap * rows;
    const wallThickness = 10;

    // Left angled wall
    const leftDeltaX = bottomRowStartX - topRowStartX;
    const leftDeltaY = bottomY - topY;
    const leftWallLength = Math.sqrt(leftDeltaX * leftDeltaX + leftDeltaY * leftDeltaY) + 40;
    const leftWallAngle = Math.atan2(leftDeltaY, leftDeltaX);
    const leftWallCenterX = (topRowStartX + bottomRowStartX) / 2 - PEG_RAD - wallThickness / 2;
    const leftWallCenterY = (topY + bottomY) / 2;

    const leftWall = Matter.Bodies.rectangle(
      leftWallCenterX, leftWallCenterY, wallThickness, leftWallLength,
      { isStatic: true, angle: leftWallAngle - Math.PI / 2, label: 'Wall' }
    );

    // Right angled wall
    const rightDeltaX = bottomRowEndX - topRowEndX;
    const rightDeltaY = bottomY - topY;
    const rightWallLength = Math.sqrt(rightDeltaX * rightDeltaX + rightDeltaY * rightDeltaY) + 40;
    const rightWallAngle = Math.atan2(rightDeltaY, rightDeltaX);
    const rightWallCenterX = (topRowEndX + bottomRowEndX) / 2 + PEG_RAD + wallThickness / 2;
    const rightWallCenterY = (topY + bottomY) / 2;

    const rightWall = Matter.Bodies.rectangle(
      rightWallCenterX, rightWallCenterY, wallThickness, rightWallLength,
      { isStatic: true, angle: rightWallAngle - Math.PI / 2, label: 'Wall' }
    );

    // Top vertical walls to contain upward bounces
    const topWallHeight = 150;
    const topWallOffset = PEG_RAD + wallThickness / 2;

    const leftTopWall = Matter.Bodies.rectangle(
      topRowStartX - topWallOffset, topY - topWallHeight / 2, wallThickness, topWallHeight,
      { isStatic: true, label: 'Wall' }
    );

    const rightTopWall = Matter.Bodies.rectangle(
      topRowEndX + topWallOffset, topY - topWallHeight / 2, wallThickness, topWallHeight,
      { isStatic: true, label: 'Wall' }
    );

    // Top horizontal wall
    const topHorizontalWallWidth = (topRowEndX + topWallOffset) - (topRowStartX - topWallOffset) + wallThickness;
    const topHorizontalWall = Matter.Bodies.rectangle(
      WIDTH / 2, topY - topWallHeight + wallThickness / 2, topHorizontalWallWidth, wallThickness,
      { isStatic: true, label: 'Wall' }
    );

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall, leftTopWall, rightTopWall, topHorizontalWall]);

    // Collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const ball = pair.bodyA.label === 'RecordBall' ? pair.bodyA :
                     pair.bodyB.label === 'RecordBall' ? pair.bodyB : null;
        const other = ball === pair.bodyA ? pair.bodyB : pair.bodyA;

        if (ball && other.label === 'Ground') {
          const positions = activeBalls.get(ball.id);
          if (positions) {
            const relX = ball.position.x - bucketStartX;
            const bucket = Math.max(0, Math.min(bucketCount - 1, Math.floor(relX / GAP)));

            if ((recordedPaths[String(bucket)]?.length || 0) < PATHS_PER_BUCKET) {
              recordedPaths[String(bucket)].push({
                positions: [...positions],
                finalBucket: bucket
              });
              console.log(`[Recorder] Bucket ${bucket}: ${recordedPaths[String(bucket)].length}/${PATHS_PER_BUCKET}`);
            }
            activeBalls.delete(ball.id);
          }
          Matter.Composite.remove(engine.world, ball);
        }
      }
    });

    // Helper functions
    const allFilled = () => {
      for (let i = 0; i < bucketCount; i++) {
        if ((recordedPaths[String(i)]?.length || 0) < PATHS_PER_BUCKET) return false;
      }
      return true;
    };

    const getTargetBucket = (): number | null => {
      // Prioritize edges (harder to hit)
      const edges = [0, 1, bucketCount - 2, bucketCount - 1];
      for (const b of edges) {
        if ((recordedPaths[String(b)]?.length || 0) < PATHS_PER_BUCKET) return b;
      }
      for (let i = 0; i < bucketCount; i++) {
        if ((recordedPaths[String(i)]?.length || 0) < PATHS_PER_BUCKET) return i;
      }
      return null;
    };

    const dropBall = () => {
      // Always drop from center with tiny random variation
      const x = WIDTH / 2 + (Math.random() - 0.5) * 6;

      // Use collision filter so balls don't collide with each other
      // Category 0x0002 = balls, mask 0x0001 = only collide with pegs/walls/ground (category 1)
      const ball = Matter.Bodies.circle(x, 5, BALL_RAD, {
        label: 'RecordBall',
        restitution: 0.5,
        friction: 0.1,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001  // Only collide with default category (pegs, walls, ground)
        }
      });
      activeBalls.set(ball.id, [{ x: ball.position.x, y: ball.position.y }]);
      Matter.Composite.add(engine.world, ball);
    };

    // Animation - configurable balls per second
    runningRef.current = true;
    let lastDrop = 0;

    const animate = (time: number) => {
      if (!runningRef.current) return;

      // Physics step
      Matter.Engine.update(engine, 16.667);

      // Record positions
      activeBalls.forEach((pos, id) => {
        const ball = Matter.Composite.allBodies(engine.world).find(b => b.id === id);
        if (ball) pos.push({ x: ball.position.x, y: ball.position.y });
      });

      // Drop new balls - use ref for current balls/sec setting
      const dropInterval = 1000 / ballsPerSecondRef.current;
      const maxBalls = Math.max(50, ballsPerSecondRef.current * 2);
      if (time - lastDrop > dropInterval && activeBalls.size < maxBalls) {
        dropBall();
        lastDrop = time;
      }

      // Clear and draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw pegs
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      pegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, PEG_RAD, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw buckets
      for (let i = 0; i < bucketCount; i++) {
        const bx = bucketStartX + i * GAP;
        const count = recordedPaths[String(i)]?.length || 0;
        const full = count >= PATHS_PER_BUCKET;

        ctx.fillStyle = full ? 'rgba(34, 197, 94, 0.3)' : 'rgba(236, 72, 153, 0.2)';
        ctx.fillRect(bx - singleBucketWidth / 2, bucketY, singleBucketWidth, 30);
        ctx.strokeStyle = full ? '#22c55e' : '#ec4899';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx - singleBucketWidth / 2, bucketY, singleBucketWidth, 30);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${multipliers[i]}x`, bx, bucketY + 12);
        ctx.fillText(`${count}/6`, bx, bucketY + 24);
      }

      // Draw balls
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      Matter.Composite.allBodies(engine.world).forEach(body => {
        if (body.label === 'RecordBall') {
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, BALL_RAD, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Update UI
      const total = Object.values(recordedPaths).reduce((s, a) => s + a.length, 0);
      const needed = bucketCount * PATHS_PER_BUCKET;
      const filled = Object.values(recordedPaths).filter(a => a.length >= PATHS_PER_BUCKET).length;

      setStatus(`Recording: ${total}/${needed} paths | ${filled}/${bucketCount} buckets`);
      setBucketCounts(Object.values(recordedPaths).map(a => a.length));
      onProgress(`${Math.round((total / needed) * 100)}%`);

      // Check completion
      if (allFilled()) {
        runningRef.current = false;
        setStatus('Saving paths...');

        const allPaths: RecordedPath[] = [];
        Object.values(recordedPaths).forEach(p => allPaths.push(...p));

        addPathsBatch(rows, allPaths).then(count => {
          console.log(`[Recorder] Saved ${count} paths!`);
          setStatus(`Done! Saved ${count} paths.`);
          setTimeout(onComplete, 1000);
        }).catch(err => {
          console.error('[Recorder] Save failed:', err);
          setStatus('Save failed: ' + err.message);
        });
        return;
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    console.log('[Recorder] Starting animation loop!');
    setStatus('Recording paths...');
    animationIdRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-black min-h-screen">
      <h2 className="text-2xl font-bold text-pink-400">Visual Path Recorder - {rows} Rows</h2>
      <div className="text-white text-lg">{status}</div>

      <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-lg">
        <label className="text-white text-sm">Balls/sec:</label>
        <input
          type="range"
          min="10"
          max="200"
          value={ballsPerSecond}
          onChange={(e) => {
            const val = Number(e.target.value);
            setBallsPerSecond(val);
            ballsPerSecondRef.current = val;
          }}
          className="w-32"
        />
        <span className="text-pink-400 font-mono w-12">{ballsPerSecond}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="border-2 border-pink-500 rounded-lg"
      />

      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {bucketCounts.map((count, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded text-xs font-mono ${
              count >= PATHS_PER_BUCKET ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            B{i}: {count}/6
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          stopRecording();
          onComplete();
        }}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
      >
        Cancel Recording
      </button>
    </div>
  );
};

export default PlinkoRecorder;
