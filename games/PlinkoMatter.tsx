import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import * as Tone from 'tone';
import BetInput from '../components/BetInput';
import {
  hasEnoughPaths,
  addPath,
  addPathsBatch,
  getRandomPath,
  getLibraryStatus,
  Position,
  RecordedPath,
  clearLibrary,
  loadLibrary,
  selectBucketByProbability,
  getBucketProbabilities,
  setBucketProbabilities,
  resetProbabilities,
  getFullLibraryStats,
  clearLibraryForRows
} from './plinkoPathLibrary';
import PlinkoRecorder from './PlinkoRecorder';

interface PlinkoMatterProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

type Difficulty = 'low' | 'medium' | 'high';
type Rows = 8 | 12 | 16;

// Note class for audio
class Note {
  private synth: Tone.PolySynth;
  public note: string;

  constructor(note: string) {
    this.synth = new Tone.PolySynth().toDestination();
    this.synth.set({ 
      volume: -20,
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.1,
        release: 0.3
      }
    });
    this.note = note;
  }

  play() {
    return this.synth.triggerAttackRelease(
      this.note,
      "64n",
      Tone.getContext().currentTime
    );
  }
}

const MULTIPLIERS = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

const PlinkoMatter: React.FC<PlinkoMatterProps> = ({ balance, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const pegsRef = useRef<Matter.Body[]>([]);
  const pegAnimsRef = useRef<(number | null)[]>([]);
  const bucketAnimsRef = useRef<(number | null)[]>([]);
  const notesRef = useRef<Note[]>([]);
  const clickSynthRef = useRef<Tone.NoiseSynth | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeBallsRef = useRef<Set<number>>(new Set());
  
  // Path recording/playback system
  const recordingPathsRef = useRef<Map<number, Position[]>>(new Map()); // ballId -> positions
  const playbackBallsRef = useRef<Map<number, { path: RecordedPath; frameIndex: number; ballId: number; bet: number }>>(new Map());
  const ballBetsRef = useRef<Map<number, number>>(new Map()); // ballId -> bet amount for physics balls
  const [isRecordingMode, setIsRecordingMode] = useState(true); // Start in recording mode by default
  const [isAutoRecording, setIsAutoRecording] = useState(false);
  const [showVisualRecorder, setShowVisualRecorder] = useState(false); // Toggle for visual recording window
  const [recordingProgress, setRecordingProgress] = useState('');
  const [showProbConfig, setShowProbConfig] = useState(false);
  const [manualBucket, setManualBucket] = useState<number | null>(null);
  const [bucketProbs, setBucketProbs] = useState<number[]>([]);
  
  const [bet, setBet] = useState(10000);
  const betRef = useRef(bet); // Ref to track current bet for closures
  const [autoDrop, setAutoDrop] = useState(false);
  const [balls, setBalls] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [rows, setRows] = useState<Rows>(16);
  const [pathsPerBucket, setPathsPerBucket] = useState(6);
  const autoDropIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [needsReset, setNeedsReset] = useState(false);

  // Keep betRef in sync with bet state
  useEffect(() => {
    betRef.current = bet;
  }, [bet]);

  // Scale pegs and balls based on row count to fill screen
  const scale = rows === 8 ? 2.0 : rows === 12 ? 1.5 : 1.0;
  const PEG_RAD = 4 * scale;
  const BALL_RAD = 7 * scale;

  const multipliers = MULTIPLIERS[difficulty][rows];
  const bucketCount = rows + 1;
  
  // Calculate dynamic spacing based on row count
  // The bottom row has (rows + 2) pegs, so we need (rows + 1) gaps between them
  const maxPegsInRow = rows + 2;
  const margin = 20; // Margin on each side to prevent clipping
  const availableWidth = 620 - (margin * 2);
  // GAP is the distance between peg centers
  const GAP = availableWidth / (maxPegsInRow - 1);
  
  // Canvas dimensions - calculate based on layout
  const width = 620;
  const height = 580;

  // Check if we're in recording mode or playback mode
  useEffect(() => {
    // Reload library from file when rows change to ensure fresh state
    const initLibrary = async () => {
      await loadLibrary();
      
      const needsRecording = !hasEnoughPaths(rows, bucketCount);
      console.log(`[Plinko] Mode check: needsRecording=${needsRecording}, setting isRecordingMode`);
      setIsRecordingMode(needsRecording);
      
      // Load bucket probabilities for current rows
      const probs = getBucketProbabilities(rows);
      setBucketProbs(probs.length === bucketCount ? probs : new Array(bucketCount).fill(1));
      
      console.log(`Rows: ${rows}, Mode: ${needsRecording ? 'RECORDING' : 'PLAYBACK'}`);
      console.log(`Library status: ${getLibraryStatus(rows, bucketCount)}`);
      console.log(`Full library stats:`, getFullLibraryStats());
    };
    
    initLibrary();
  }, [rows, bucketCount]);

  // Initialize Tone.js audio
  useEffect(() => {
    const noteNames = ["C#5", "C5", "B5", "A#5", "A5", "G#4", "G4", "F#4", "F4"];
    const allNotes = [...noteNames, ...noteNames.slice().reverse()];
    notesRef.current = allNotes.slice(0, bucketCount).map(note => new Note(note));

    clickSynthRef.current = new Tone.NoiseSynth().toDestination();
    clickSynthRef.current.set({ 
      volume: -36,
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    });

    return () => {
      if (clickSynthRef.current) {
        clickSynthRef.current.dispose();
      }
    };
  }, [bucketCount]);

  // Reset when difficulty or rows change
  useEffect(() => {
    if (engineRef.current) {
      setNeedsReset(true);
    }
  }, [difficulty, rows]);

  // Initialize Matter.js
  useEffect(() => {
    if (!canvasRef.current) return;

    // Clear existing engine
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      Matter.World.clear(engineRef.current.world, false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    activeBallsRef.current.clear();
    setNeedsReset(false);

    const engine = Matter.Engine.create({
      gravity: { scale: 0.0007 }
    });
    engineRef.current = engine;

    // Create pegs with proper scaling
    const pegs: Matter.Body[] = [];
    const rowCount = rows;
    const verticalGap = (height - 80) / (rowCount + 1);
    
    for (let r = 0; r < rowCount; r++) {
      const pegsInRow = r + 3;
      // Calculate starting x position so pegs are centered with margin
      const rowWidth = (pegsInRow - 1) * GAP;
      const startX = (width - rowWidth) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * GAP;
        const y = 40 + verticalGap * (r + 1);
        const peg = Matter.Bodies.circle(x, y, PEG_RAD, {
          isStatic: true,
          label: 'Peg',
          render: { fillStyle: '#fff' }
        });
        pegs.push(peg);
      }
    }
    Matter.Composite.add(engine.world, pegs);
    pegsRef.current = pegs;
    pegAnimsRef.current = new Array(pegs.length).fill(null);
    bucketAnimsRef.current = new Array(bucketCount).fill(null);

    // Bucket dimensions - match peg spacing exactly
    // Bottom row has (rows + 2) pegs, creating (rows + 1) slots
    const bottomRowPegs = rows + 2;
    const singleBucketWidth = GAP - 6; // GAP minus small spacing
    // Calculate startX to match the peg layout (centered)
    const bottomRowWidth = (bottomRowPegs - 1) * GAP;
    const pegStartX = (width - bottomRowWidth) / 2;
    // Buckets go between pegs, so offset by half a GAP
    const startX = pegStartX + GAP / 2 - singleBucketWidth / 2;
    const bucketY = height - 45;

    // Create ground at the bucket level
    const ground = Matter.Bodies.rectangle(width / 2, bucketY - 5, width * 2, 10, {
      isStatic: true,
      label: 'Ground',
      render: { visible: false }
    });
    
    // Create angled walls along the pyramid edges to contain balls
    // Top row (first row of pegs): 3 pegs
    const topRowPegs = 3;
    const topRowWidth = (topRowPegs - 1) * GAP;
    const topRowStartX = (width - topRowWidth) / 2;
    const topRowEndX = topRowStartX + topRowWidth;
    const topY = 40 + verticalGap;
    
    // Bottom row: rows + 2 pegs
    const bottomRowStartX = pegStartX;
    const bottomRowEndX = pegStartX + bottomRowWidth;
    const bottomY = 40 + verticalGap * rows;
    
    // Wall thickness
    const wallThickness = 10;
    
    // Left wall runs from top-left peg to bottom-left peg
    // Top left: (topRowStartX, topY), Bottom left: (bottomRowStartX, bottomY)
    const leftDeltaX = bottomRowStartX - topRowStartX; // negative (goes left)
    const leftDeltaY = bottomY - topY; // positive (goes down)
    const leftWallLength = Math.sqrt(leftDeltaX * leftDeltaX + leftDeltaY * leftDeltaY) + 40;
    const leftWallAngle = Math.atan2(leftDeltaY, leftDeltaX); // angle from horizontal
    
    // Position wall at center of the line, offset outward
    const leftWallCenterX = (topRowStartX + bottomRowStartX) / 2 - PEG_RAD - wallThickness / 2;
    const leftWallCenterY = (topY + bottomY) / 2;
    
    const leftWall = Matter.Bodies.rectangle(
      leftWallCenterX,
      leftWallCenterY,
      wallThickness,
      leftWallLength,
      {
        isStatic: true,
        angle: leftWallAngle - Math.PI / 2, // rotate to align with the edge
        label: 'Wall',
        render: { visible: false }
      }
    );
    
    // Right wall runs from top-right peg to bottom-right peg
    // Top right: (topRowEndX, topY), Bottom right: (bottomRowEndX, bottomY)
    const rightDeltaX = bottomRowEndX - topRowEndX; // positive (goes right)
    const rightDeltaY = bottomY - topY; // positive (goes down)
    const rightWallLength = Math.sqrt(rightDeltaX * rightDeltaX + rightDeltaY * rightDeltaY) + 40;
    const rightWallAngle = Math.atan2(rightDeltaY, rightDeltaX);
    
    // Position wall at center of the line, offset outward
    const rightWallCenterX = (topRowEndX + bottomRowEndX) / 2 + PEG_RAD + wallThickness / 2;
    const rightWallCenterY = (topY + bottomY) / 2;
    
    const rightWall = Matter.Bodies.rectangle(
      rightWallCenterX,
      rightWallCenterY,
      wallThickness,
      rightWallLength,
      {
        isStatic: true,
        angle: rightWallAngle - Math.PI / 2, // rotate to align with the edge
        label: 'Wall',
        render: { visible: false }
      }
    );
    
    // Add vertical walls at the top to prevent balls from escaping upward
    const topWallHeight = 150; // Height of the vertical extension (tall to contain edge shots)
    const topWallOffset = PEG_RAD + wallThickness / 2;
    
    // Left top vertical wall
    const leftTopWall = Matter.Bodies.rectangle(
      topRowStartX - topWallOffset,
      topY - topWallHeight / 2,
      wallThickness,
      topWallHeight,
      {
        isStatic: true,
        label: 'Wall',
        render: { visible: false }
      }
    );
    
    // Right top vertical wall
    const rightTopWall = Matter.Bodies.rectangle(
      topRowEndX + topWallOffset,
      topY - topWallHeight / 2,
      wallThickness,
      topWallHeight,
      {
        isStatic: true,
        label: 'Wall',
        render: { visible: false }
      }
    );
    
    // Horizontal top wall connecting left and right vertical walls
    // This forms a "cup" to contain balls that bounce up and sideways
    const topHorizontalWallWidth = (topRowEndX + topWallOffset) - (topRowStartX - topWallOffset) + wallThickness;
    const topHorizontalWall = Matter.Bodies.rectangle(
      width / 2, // centered
      topY - topWallHeight + wallThickness / 2, // at the top of the vertical walls
      topHorizontalWallWidth,
      wallThickness,
      {
        isStatic: true,
        label: 'Wall',
        render: { visible: false }
      }
    );
    
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall, leftTopWall, rightTopWall, topHorizontalWall]);

    // Collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        // Ball hitting ground
        if ((bodyA.label === 'Ball' && bodyB.label === 'Ground') || 
            (bodyB.label === 'Ball' && bodyA.label === 'Ground')) {
          const ball = bodyA.label === 'Ball' ? bodyA : bodyB;
          
          // Calculate bucket index based on ball position using GAP spacing
          const relativeX = ball.position.x - startX;
          const index = Math.max(0, Math.min(bucketCount - 1, Math.floor(relativeX / GAP)));
          
          if (index >= 0 && index < bucketCount) {
            // Get the bet that was placed for this specific ball
            const ballBet = ballBetsRef.current.get(ball.id) || betRef.current;
            const multiplier = multipliers[index];
            const winAmount = Math.floor(ballBet * multiplier);
            
            // If recording, save this path (async)
            if (recordingPathsRef.current.has(ball.id)) {
              const positions = recordingPathsRef.current.get(ball.id)!;
              const recordedPath: RecordedPath = {
                positions,
                finalBucket: index
              };
              // Fire and forget - don't block on save
              addPath(rows, recordedPath).then(() => {
                // Check if we now have enough paths
                if (hasEnoughPaths(rows, bucketCount)) {
                  setIsRecordingMode(false);
                  console.log('Recording complete! Switching to playback mode.');
                }
              });
              recordingPathsRef.current.delete(ball.id);
            }
            
            // Play note
            if (notesRef.current[index]) {
              notesRef.current[index].play();
            }
            
            // Trigger bucket animation
            bucketAnimsRef.current[index] = Date.now();
            
            activeBallsRef.current.delete(ball.id);
            ballBetsRef.current.delete(ball.id); // Clean up bet storage
            if (activeBallsRef.current.size === 0) {
              setBalls(prev => prev - 1);
            }
            
            // Bet was already deducted on drop, so give full winAmount back
            onComplete(true, winAmount);
          }
          
          Matter.Composite.remove(engine.world, ball);
        }

        // Ball hitting peg
        if ((bodyA.label === 'Peg' && bodyB.label === 'Ball') || 
            (bodyB.label === 'Peg' && bodyA.label === 'Ball')) {
          const peg = bodyA.label === 'Peg' ? bodyA : bodyB;
          const index = pegs.findIndex((p) => p === peg);
          if (index !== -1 && !pegAnimsRef.current[index]) {
            pegAnimsRef.current[index] = Date.now();
          }
        }
      });
    });

    // Custom animation loop
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    function run() {
      Matter.Engine.update(engine, 1000 / 60);
      
      // Fill background with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Draw pegs with glow
      pegs.forEach((peg, i) => {
        const anim = pegAnimsRef.current[i];
        if (anim) {
          const elapsed = Date.now() - anim;
          if (elapsed < 800) {
            const t = elapsed / 800;
            const expandRadius = PEG_RAD + (1 - Math.pow(t - 0.5, 2) * 4) * 5;
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(peg.position.x, peg.position.y, expandRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - t})`;
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            pegAnimsRef.current[i] = null;
          }
        }
        
        // Draw peg with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, PEG_RAD, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      // Draw balls with glow (and record positions if in recording mode)
      const ballBodies = Matter.Composite.allBodies(engine.world).filter(b => b.label === 'Ball');
      ballBodies.forEach(ball => {
        // Record position if this ball is being tracked
        if (recordingPathsRef.current.has(ball.id)) {
          const positions = recordingPathsRef.current.get(ball.id)!;
          positions.push({ x: ball.position.x, y: ball.position.y });
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, BALL_RAD, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
          ball.position.x - BALL_RAD / 3, 
          ball.position.y - BALL_RAD / 3, 
          0,
          ball.position.x, 
          ball.position.y, 
          BALL_RAD
        );
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      // Update and draw playback balls (pre-recorded paths)
      playbackBallsRef.current.forEach((playback, key) => {
        const { path, frameIndex } = playback;
        
        if (frameIndex < path.positions.length) {
          const pos = path.positions[frameIndex];
          
          // Draw the playback ball
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ff0000';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, BALL_RAD, 0, Math.PI * 2);
          
          const gradient = ctx.createRadialGradient(
            pos.x - BALL_RAD / 3, 
            pos.y - BALL_RAD / 3, 
            0,
            pos.x, 
            pos.y, 
            BALL_RAD
          );
          gradient.addColorStop(0, '#ff4444');
          gradient.addColorStop(1, '#cc0000');
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Check for peg collisions for glow effect (approximate)
          pegs.forEach((peg, pegIndex) => {
            const dx = pos.x - peg.position.x;
            const dy = pos.y - peg.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < PEG_RAD + BALL_RAD + 2 && !pegAnimsRef.current[pegIndex]) {
              pegAnimsRef.current[pegIndex] = Date.now();
            }
          });
          
          playback.frameIndex++;
        } else {
          // Path complete - trigger bucket animation and complete
          const bucketIndex = path.finalBucket;
          
          if (notesRef.current[bucketIndex]) {
            notesRef.current[bucketIndex].play();
          }
          
          bucketAnimsRef.current[bucketIndex] = Date.now();
          
          const multiplier = multipliers[bucketIndex];
          // Use the stored bet for this specific ball, not the current bet
          const ballBet = playback.bet;
          const winAmount = Math.floor(ballBet * multiplier);
          // Bet was already deducted on drop, so give full winAmount back
          onComplete(true, winAmount);
          
          playbackBallsRef.current.delete(key);
        }
      });
      
      // Draw multiplier buckets inside the canvas - match peg spacing
      const bucketY = height - 45;
      const bucketHeight = 35;
      const bottomRowPegs = rows + 2;
      const singleBucketWidth = GAP - 6;
      // Calculate startX to match the peg layout (centered)
      const bottomRowWidth = (bottomRowPegs - 1) * GAP;
      const pegStartX = (width - bottomRowWidth) / 2;
      // Buckets go between pegs, so offset by half a GAP
      const startX = pegStartX + GAP / 2 - singleBucketWidth / 2;
      
      multipliers.forEach((mult, i) => {
        const anim = bucketAnimsRef.current[i];
        let animScale = 1;
        let animBrightness = 1;
        
        // Check for active animation
        if (anim) {
          const elapsed = Date.now() - anim;
          if (elapsed < 500) {
            const t = elapsed / 500;
            // Scale down then back up
            animScale = 1 - Math.sin(t * Math.PI) * 0.1;
            // Brighten then fade
            animBrightness = 1 + Math.sin(t * Math.PI) * 0.5;
          } else {
            bucketAnimsRef.current[i] = null;
          }
        }
        
        // Color based on multiplier value
        // Under 1x = pure red, 1x and above = gradient from yellow to green based on value
        let r, g, b;
        
        if (mult < 1) {
          // Pure red for losses (under 1x)
          r = Math.floor(220 * animBrightness);
          g = Math.floor(38 * animBrightness);
          b = Math.floor(38 * animBrightness);
        } else {
          // For 1x and above: gradient from yellow (low) to green (high)
          // Calculate how far along the multiplier scale (1x to max)
          const maxMult = Math.max(...multipliers);
          const multRatio = Math.min(1, (mult - 1) / (maxMult - 1));
          
          // Yellow: rgb(234, 179, 8) -> Green: rgb(34, 197, 94)
          r = Math.floor((234 + (34 - 234) * multRatio) * animBrightness);
          g = Math.floor((179 + (197 - 179) * multRatio) * animBrightness);
          b = Math.floor((8 + (94 - 8) * multRatio) * animBrightness);
        }
        
        const baseColor = `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
        
        // Darker version for gradient
        const r2 = Math.floor(r * 0.6);
        const g2 = Math.floor(g * 0.6);
        const b2 = Math.floor(b * 0.6);
        const darkColor = `rgb(${Math.min(255, r2)}, ${Math.min(255, g2)}, ${Math.min(255, b2)})`;
        
        const shadowColor = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, 0.6)`;
        
        // Calculate position with animation scale
        const baseX = startX + i * GAP;
        const scaledWidth = singleBucketWidth * animScale;
        const scaledHeight = bucketHeight * animScale;
        const x = baseX + (singleBucketWidth - scaledWidth) / 2;
        const y = bucketY + (bucketHeight - scaledHeight) / 2;
        
        // Draw bucket background with solid color
        // Glow effect - stronger when animating
        ctx.shadowBlur = anim ? 25 : 8;
        ctx.shadowColor = shadowColor;
        
        // Rounded rectangle
        const radius = 4 * animScale;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + scaledWidth - radius, y);
        ctx.quadraticCurveTo(x + scaledWidth, y, x + scaledWidth, y + radius);
        ctx.lineTo(x + scaledWidth, y + scaledHeight - radius);
        ctx.quadraticCurveTo(x + scaledWidth, y + scaledHeight, x + scaledWidth - radius, y + scaledHeight);
        ctx.lineTo(x + radius, y + scaledHeight);
        ctx.quadraticCurveTo(x, y + scaledHeight, x, y + scaledHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Text - white for contrast on colored backgrounds
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(14 * animScale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${mult}x`, x + scaledWidth / 2, y + scaledHeight / 2);
      });
      
      animationFrameRef.current = requestAnimationFrame(run);
    }
    
    run();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (autoDropIntervalRef.current) {
        clearInterval(autoDropIntervalRef.current);
      }
      Matter.Engine.clear(engine);
    };
  }, [rows, difficulty, needsReset]);

  // Auto-drop interval
  useEffect(() => {
    if (autoDrop && balls > 0) {
      autoDropIntervalRef.current = setInterval(() => {
        dropBall();
      }, 400);
    } else {
      if (autoDropIntervalRef.current) {
        clearInterval(autoDropIntervalRef.current);
        autoDropIntervalRef.current = null;
      }
    }

    return () => {
      if (autoDropIntervalRef.current) {
        clearInterval(autoDropIntervalRef.current);
      }
    };
  }, [autoDrop, balls]);

  const dropBall = async () => {
    if (balls <= 0) return;
    if (bet > balance) return; // Can't bet more than balance
    
    // Deduct the bet immediately when dropping
    onComplete(false, bet);
    
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    
    if (clickSynthRef.current) {
      clickSynthRef.current.triggerAttackRelease("32n");
    }
    
    if (isRecordingMode) {
      // RECORDING MODE: Drop a real physics ball and record its path
      if (!engineRef.current) return;
      
      const x = width / 2 + (Math.random() - 0.5) * 10;
      const ball = Matter.Bodies.circle(x, 0, BALL_RAD, {
        label: 'Ball',
        restitution: 0.6,
        render: { fillStyle: '#ff1493' }
      });
      
      // Store the bet for this ball so winnings are calculated correctly
      ballBetsRef.current.set(ball.id, bet);
      
      // Start recording this ball's path
      recordingPathsRef.current.set(ball.id, [{ x: ball.position.x, y: ball.position.y }]);
      
      activeBallsRef.current.add(ball.id);
      Matter.Composite.add(engineRef.current.world, ball);
      
      console.log(`Recording ball ${ball.id}...`);
    } else {
      // PLAYBACK MODE: Pick target bucket (manual or by probability), then play recorded path
      const targetBucket = manualBucket !== null 
        ? manualBucket 
        : selectBucketByProbability(rows, bucketCount);
      
      console.log('[Plinko] PLAYBACK MODE - targeting bucket:', targetBucket);
      const path = getRandomPath(rows, targetBucket);
      
      if (path) {
        console.log('[Plinko] Got path with', path.positions.length, 'positions, starting playback');
        const playbackId = Date.now() + Math.random();
        playbackBallsRef.current.set(playbackId, {
          path,
          frameIndex: 0,
          ballId: playbackId,
          bet: bet // Store the bet for this playback ball
        });
        console.log(`Playing back path to bucket ${targetBucket}${manualBucket !== null ? ' (MANUAL)' : ''}`);
      } else {
        // Fallback to recording mode if no path found - RECORD this ball!
        console.log(`No path found for bucket ${targetBucket}, falling back to physics AND RECORDING`);
        if (!engineRef.current) return;
        
        const x = width / 2 + (Math.random() - 0.5) * 10;
        const ball = Matter.Bodies.circle(x, 0, BALL_RAD, {
          label: 'Ball',
          restitution: 0.6,
          render: { fillStyle: '#ff1493' }
        });
        
        // Store the bet for this ball so winnings are calculated correctly
        ballBetsRef.current.set(ball.id, bet);
        
        // IMPORTANT: Record this ball's path since we're missing paths
        recordingPathsRef.current.set(ball.id, [{ x: ball.position.x, y: ball.position.y }]);
        console.log(`[Plinko] Started recording fallback ball ${ball.id}`);
        
        activeBallsRef.current.add(ball.id);
        Matter.Composite.add(engineRef.current.world, ball);
      }
    }
  };
  
  // Handle probability change for a bucket
  const handleProbChange = async (bucketIndex: number, value: number) => {
    const newProbs = [...bucketProbs];
    newProbs[bucketIndex] = Math.max(0, value);
    setBucketProbs(newProbs);
    await setBucketProbabilities(rows, newProbs);
  };

  // Fast automated path recording - runs physics simulation at high speed
  const runFastRecording = async () => {
    if (isAutoRecording) return;
    setIsAutoRecording(true);
    setRecordingProgress('Initializing...');
    
    // Small delay to let UI update
    await new Promise(r => setTimeout(r, 100));
    
    const currentRows = rows;
    const currentBucketCount = bucketCount;
    const currentScale = currentRows === 8 ? 2.0 : currentRows === 12 ? 1.5 : 1.0;
    const currentPegRad = 4 * currentScale;
    const currentBallRad = 7 * currentScale;
    const currentMaxPegsInRow = currentRows + 2;
    const currentAvailableWidth = 620 - (margin * 2);
    const currentGAP = currentAvailableWidth / (currentMaxPegsInRow - 1);
    
    // Create a separate physics engine for fast simulation
    const simEngine = Matter.Engine.create({
      gravity: { scale: 0.0007 }
    });
    
    // Create pegs
    const simPegs: Matter.Body[] = [];
    const verticalGap = (height - 80) / (currentRows + 1);
    
    for (let r = 0; r < currentRows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * currentGAP;
      const startX = (width - rowWidth) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * currentGAP;
        const y = 40 + verticalGap * (r + 1);
        const peg = Matter.Bodies.circle(x, y, currentPegRad, {
          isStatic: true,
          label: 'Peg'
        });
        simPegs.push(peg);
      }
    }
    Matter.Composite.add(simEngine.world, simPegs);
    
    // Calculate bucket positions
    const bottomRowPegs = currentRows + 2;
    const bottomRowWidth = (bottomRowPegs - 1) * currentGAP;
    const pegStartX = (width - bottomRowWidth) / 2;
    const singleBucketWidth = currentGAP - 6;
    const startX = pegStartX + currentGAP / 2 - singleBucketWidth / 2;
    const bucketY = height - 45;
    
    // Create ground
    const ground = Matter.Bodies.rectangle(width / 2, bucketY - 5, width * 2, 10, {
      isStatic: true,
      label: 'Ground'
    });
    
    // Create walls (same as main game)
    const topRowPegs = 3;
    const topRowWidth = (topRowPegs - 1) * currentGAP;
    const topRowStartX = (width - topRowWidth) / 2;
    const topRowEndX = topRowStartX + topRowWidth;
    const topY = 40 + verticalGap;
    const bottomRowStartX = pegStartX;
    const bottomRowEndX = pegStartX + bottomRowWidth;
    const bottomY = 40 + verticalGap * currentRows;
    const wallThickness = 10;
    
    const leftDeltaX = bottomRowStartX - topRowStartX;
    const leftDeltaY = bottomY - topY;
    const leftWallLength = Math.sqrt(leftDeltaX * leftDeltaX + leftDeltaY * leftDeltaY) + 40;
    const leftWallAngle = Math.atan2(leftDeltaY, leftDeltaX);
    const leftWallCenterX = (topRowStartX + bottomRowStartX) / 2 - currentPegRad - wallThickness / 2;
    const leftWallCenterY = (topY + bottomY) / 2;
    
    const leftWall = Matter.Bodies.rectangle(leftWallCenterX, leftWallCenterY, wallThickness, leftWallLength, {
      isStatic: true,
      angle: leftWallAngle - Math.PI / 2,
      label: 'Wall'
    });
    
    const rightDeltaX = bottomRowEndX - topRowEndX;
    const rightDeltaY = bottomY - topY;
    const rightWallLength = Math.sqrt(rightDeltaX * rightDeltaX + rightDeltaY * rightDeltaY) + 40;
    const rightWallAngle = Math.atan2(rightDeltaY, rightDeltaX);
    const rightWallCenterX = (topRowEndX + bottomRowEndX) / 2 + currentPegRad + wallThickness / 2;
    const rightWallCenterY = (topY + bottomY) / 2;
    
    const rightWall = Matter.Bodies.rectangle(rightWallCenterX, rightWallCenterY, wallThickness, rightWallLength, {
      isStatic: true,
      angle: rightWallAngle - Math.PI / 2,
      label: 'Wall'
    });
    
    const topWallHeight = 150;
    const topWallOffset = currentPegRad + wallThickness / 2;
    const leftTopWall = Matter.Bodies.rectangle(topRowStartX - topWallOffset, topY - topWallHeight / 2, wallThickness, topWallHeight, {
      isStatic: true,
      label: 'Wall'
    });
    const rightTopWall = Matter.Bodies.rectangle(topRowEndX + topWallOffset, topY - topWallHeight / 2, wallThickness, topWallHeight, {
      isStatic: true,
      label: 'Wall'
    });
    
    // Horizontal top wall for simulation
    const topHorizontalWallWidth = (topRowEndX + topWallOffset) - (topRowStartX - topWallOffset) + wallThickness;
    const topHorizontalWall = Matter.Bodies.rectangle(
      width / 2,
      topY - topWallHeight + wallThickness / 2,
      topHorizontalWallWidth,
      wallThickness,
      {
        isStatic: true,
        label: 'Wall'
      }
    );
    
    Matter.Composite.add(simEngine.world, [ground, leftWall, rightWall, leftTopWall, rightTopWall, topHorizontalWall]);
    
    const targetPathsPerBucket = pathsPerBucket;
    
    // Track paths locally before batch saving
    const localPaths: { [bucket: string]: RecordedPath[] } = {};
    for (let i = 0; i < currentBucketCount; i++) {
      localPaths[String(i)] = [];
    }
    
    // Find bucket that needs paths most (prioritize edges)
    const getBucketNeedingPaths = (): number | null => {
      // First check edges (hardest to hit)
      const edgeBuckets = [0, 1, currentBucketCount - 2, currentBucketCount - 1];
      for (const b of edgeBuckets) {
        if (localPaths[String(b)].length < targetPathsPerBucket) return b;
      }
      // Then check all buckets
      for (let i = 0; i < currentBucketCount; i++) {
        if (localPaths[String(i)].length < targetPathsPerBucket) return i;
      }
      return null;
    };
    
    // Calculate drop X position to bias toward a target bucket
    const getDropXForBucket = (targetBucket: number): number => {
      // Map bucket index to a starting X position
      // Bucket 0 = far left, bucket max = far right
      const bucketRatio = targetBucket / (currentBucketCount - 1); // 0 to 1
      const dropRange = 40; // How much we can vary the drop position
      const centerX = width / 2;
      const offset = (bucketRatio - 0.5) * dropRange * 2;
      // Add some randomness but biased toward target
      return centerX + offset + (Math.random() - 0.5) * 15;
    };
    
    // Run simulation targeting a specific bucket
    const simulateBall = (targetBucket: number | null): RecordedPath | null => {
      const x = targetBucket !== null 
        ? getDropXForBucket(targetBucket)
        : width / 2 + (Math.random() - 0.5) * 10;
      
      const ball = Matter.Bodies.circle(x, 0, currentBallRad, {
        label: 'SimBall',
        restitution: 0.6
      });
      Matter.Composite.add(simEngine.world, ball);
      
      const positions: Position[] = [{ x: ball.position.x, y: ball.position.y }];
      
      // Run physics until ball hits ground - use standard timestep
      for (let step = 0; step < 600; step++) {
        Matter.Engine.update(simEngine, 16.667); // Standard 60fps timestep
        
        // Only record every 2nd position to save memory
        if (step % 2 === 0) {
          positions.push({ x: ball.position.x, y: ball.position.y });
        }
        
        // Check if ball hit ground
        if (ball.position.y >= bucketY - 10) {
          const relativeX = ball.position.x - startX;
          const bucketIndex = Math.max(0, Math.min(currentBucketCount - 1, Math.floor(relativeX / currentGAP)));
          
          Matter.Composite.remove(simEngine.world, ball);
          
          return {
            positions,
            finalBucket: bucketIndex
          };
        }
      }
      
      // Ball got stuck, remove and return null
      Matter.Composite.remove(simEngine.world, ball);
      return null;
    };
    
    // Check if all buckets have enough paths locally
    const allBucketsFilled = () => {
      for (let i = 0; i < currentBucketCount; i++) {
        if (localPaths[String(i)].length < targetPathsPerBucket) {
          return false;
        }
      }
      return true;
    };
    
    // Get status string for display
    const getStatusString = () => {
      return Object.entries(localPaths)
        .map(([b, p]) => `${p.length}`)
        .join('|');
    };
    
    // Record paths for all buckets - keep going until ALL buckets have enough
    let totalRecorded = 0;
    const targetTotal = currentBucketCount * targetPathsPerBucket;
    let attempts = 0;
    const maxAttempts = 10000; // Much higher to ensure edge buckets fill
    
    console.log('[Recording] Starting fast recording...');
    setRecordingProgress(`Starting... Target: ${targetTotal} paths`);
    await new Promise(r => setTimeout(r, 100));
    
    while (!allBucketsFilled() && attempts < maxAttempts) {
      // Find which bucket needs paths and target it
      const targetBucket = getBucketNeedingPaths();
      const path = simulateBall(targetBucket);
      
      if (path) {
        const bucketKey = String(path.finalBucket);
        // Only add if bucket needs more paths
        if (localPaths[bucketKey].length < targetPathsPerBucket) {
          localPaths[bucketKey].push(path);
          totalRecorded++;
          
          // Log every successful recording
          if (totalRecorded <= 20 || totalRecorded % 10 === 0) {
            console.log(`[Recording] Path ${totalRecorded}: bucket ${bucketKey} now has ${localPaths[bucketKey].length}/${targetPathsPerBucket}`);
          }
        }
      }
      
      attempts++;
      
      // Update UI more frequently - every 10 attempts
      if (attempts % 10 === 0) {
        const progress = Math.min(100, Math.round((totalRecorded / targetTotal) * 100));
        const needed = currentBucketCount - Object.values(localPaths).filter(p => p.length >= targetPathsPerBucket).length;
        setRecordingProgress(`${progress}% (${totalRecorded}/${targetTotal}) | ${needed} buckets left | [${getStatusString()}]`);
        // Yield for UI update - use setTimeout to actually let React render
        await new Promise(r => setTimeout(r, 1));
      }
    }
    
    console.log(`[Recording] Loop finished. Attempts: ${attempts}, Recorded: ${totalRecorded}`);
    
    if (!allBucketsFilled()) {
      console.warn('Recording stopped before all buckets filled! Attempts:', attempts);
      // Show which buckets are missing
      for (let i = 0; i < currentBucketCount; i++) {
        if (localPaths[String(i)].length < targetPathsPerBucket) {
          console.warn(`Bucket ${i} only has ${localPaths[String(i)].length} paths`);
        }
      }
    }
    
    // Now batch save all paths at once
    setRecordingProgress('Saving all paths to file...');
    await new Promise(r => setTimeout(r, 50));
    
    // Collect all paths into single array
    const allPaths: RecordedPath[] = [];
    for (const paths of Object.values(localPaths)) {
      allPaths.push(...paths);
    }
    
    // Single batch save
    const savedCount = await addPathsBatch(currentRows, allPaths);
    console.log(`Saved ${savedCount} paths in batch`);
    
    // Cleanup
    Matter.Engine.clear(simEngine);
    
    // Reload library to verify
    await loadLibrary();
    
    setRecordingProgress('Complete!');
    setIsRecordingMode(false);
    setIsAutoRecording(false);
    
    console.log('Fast recording complete!');
    console.log(`Library status: ${getLibraryStatus(currentRows, currentBucketCount)}`);
  };

  return (
    <>
      {/* Visual Recorder Overlay */}
      {showVisualRecorder && (
        <div className="fixed inset-0 z-50 bg-black">
          <PlinkoRecorder 
            rows={rows}
            pathsPerBucket={pathsPerBucket}
            onComplete={async () => {
              setShowVisualRecorder(false);
              await loadLibrary();
              const needsRecording = !hasEnoughPaths(rows, bucketCount);
              setIsRecordingMode(needsRecording);
            }}
            onProgress={(progress) => setRecordingProgress(progress)}
          />
        </div>
      )}
      
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="flex gap-6 items-start">
          {/* Settings Panel */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-pink-500/20 w-64 flex flex-col gap-3">
            {/* Recording Mode Indicator */}
            {isRecordingMode && (
              <div className="bg-red-900/50 border border-red-500/50 rounded-lg px-3 py-2">
                <div className="text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {isAutoRecording || showVisualRecorder ? 'RECORDING' : 'NEEDS PATHS'}
                </div>
                {(isAutoRecording || showVisualRecorder) ? (
                  <div className="text-red-300 text-[10px] mt-2 font-mono break-all leading-relaxed">
                    {recordingProgress}
                  </div>
                ) : (
                  <div className="text-red-300 text-[10px] mt-1 text-center">
                    Choose recording mode below
                  </div>
                )}
                {!isAutoRecording && !showVisualRecorder && (
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={() => setShowVisualRecorder(true)}
                      className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      👁️ Visual Recording (Recommended)
                    </button>
                    <button
                      onClick={runFastRecording}
                      className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      ⚡ Fast Recording (Hidden)
                    </button>
                  </div>
                )}
              </div>
            )}
          
          {/* Back Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-lg shadow-pink-500/50 transition-all hover:scale-105 text-sm"
          >
            ← Back
          </button>

          {/* Bet Amount */}
          <BetInput
            value={bet}
            onChange={(v) => setBet(Math.max(1, v))}
            maxValue={balance}
            disabled={false}
          />

          {/* Rows */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-pink-300 text-xs font-semibold">Rows</label>
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">{rows}</span>
            </div>
            <input
              type="range"
              min="8"
              max="16"
              step="4"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) as Rows)}
              disabled={activeBallsRef.current.size > 0}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50"
            />
          </div>

          {/* Paths Per Bucket (for recording) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-pink-300 text-xs font-semibold">Paths/Bucket</label>
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">{pathsPerBucket}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={pathsPerBucket}
              onChange={(e) => setPathsPerBucket(parseInt(e.target.value))}
              disabled={isAutoRecording || showVisualRecorder}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50"
            />
            <p className="text-gray-500 text-[10px]">Paths recorded per bucket slot</p>
          </div>

          {/* Risk */}
          <div className="space-y-2">
            <label className="text-pink-300 text-xs font-semibold block">Risk</label>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={activeBallsRef.current.size > 0}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    difficulty === d
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Ball Button */}
          <button
            onClick={dropBall}
            disabled={balls <= 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-pink-500/50 transition-all hover:scale-105 disabled:scale-100 disabled:shadow-none mt-1"
          >
            Drop Ball
          </button>

          {/* Auto Drop Toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="text-pink-300 text-xs font-semibold">Auto Drop</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoDrop}
                onChange={(e) => setAutoDrop(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-600 peer-checked:to-purple-600"></div>
            </label>
          </div>
          
          {/* Reset Paths Button (for testing) */}
          <button
            onClick={async () => {
              await clearLibrary();
              await loadLibrary();
              setIsRecordingMode(true);
            }}
            className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-all border border-gray-600"
          >
            Reset All Paths
          </button>
          
          {/* Clear current rows paths */}
          <button
            onClick={async () => {
              await clearLibraryForRows(rows);
              setIsRecordingMode(true);
            }}
            className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-all border border-gray-600"
          >
            Reset {rows}-Row Paths
          </button>
          
          {/* Manual Bucket Selector */}
          {!isRecordingMode && (
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <label className="text-pink-300 text-xs font-semibold">Manual Bucket</label>
                {manualBucket !== null && (
                  <button
                    onClick={() => setManualBucket(null)}
                    className="text-[10px] text-gray-400 hover:text-white px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={manualBucket ?? ''}
                onChange={(e) => setManualBucket(e.target.value === '' ? null : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none transition-colors"
              >
                <option value="">Auto (Probability)</option>
                {multipliers.map((mult, i) => (
                  <option key={i} value={i}>
                    Bucket {i} ({mult}x)
                  </option>
                ))}
              </select>
              {manualBucket !== null && (
                <div className="text-[10px] text-yellow-400 text-center">
                  ⚠️ Manual mode: Always targets bucket {manualBucket}
                </div>
              )}
            </div>
          )}
          
          {/* Probability Config Toggle */}
          {!isRecordingMode && (
            <button
              onClick={() => setShowProbConfig(!showProbConfig)}
              className="w-full px-3 py-1.5 bg-purple-900/50 hover:bg-purple-900/70 text-purple-300 hover:text-white rounded-lg text-xs transition-all border border-purple-600/50"
            >
              {showProbConfig ? '▲ Hide' : '▼ Show'} Probability Config
            </button>
          )}
        </div>
        
        {/* Probability Configuration Panel */}
        {showProbConfig && !isRecordingMode && (
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-purple-500/20 w-64 flex flex-col gap-2 max-h-[580px] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-purple-300 text-sm font-bold">Bucket Probabilities</h3>
              <button
                onClick={() => {
                  resetProbabilities();
                  setBucketProbs(getBucketProbabilities(rows));
                }}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded"
              >
                Reset
              </button>
            </div>
            <div className="text-[10px] text-gray-400 mb-2">
              Higher values = higher chance. Total weight: {bucketProbs.reduce((a, b) => a + b, 0)}
            </div>
            {bucketProbs.map((prob, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-8">B{i}</span>
                <span className={`text-[10px] font-semibold w-10 ${multipliers[i] < 1 ? 'text-red-400' : 'text-green-400'}`}>
                  {multipliers[i]}x
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={prob}
                  onChange={(e) => handleProbChange(i, parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600 focus:border-purple-500 focus:outline-none w-12"
                />
                <span className="text-[10px] text-gray-500 w-10">
                  {((prob / Math.max(1, bucketProbs.reduce((a, b) => a + b, 0))) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

          {/* Game Canvas */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl blur-xl"></div>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="relative bg-black rounded-xl border border-pink-500/30 shadow-2xl"
            />
          </div>
        </div>
        
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(to right, #db2777, #9333ea);
            cursor: pointer;
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(to right, #db2777, #9333ea);
            cursor: pointer;
            border: none;
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
          }
        `}</style>
      </div>
    </>
  );
};

export default PlinkoMatter;
