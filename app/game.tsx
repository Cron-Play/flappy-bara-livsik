
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const BIRD_SIZE = 40;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 3;
const GROUND_HEIGHT = 100;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export default function FlappyFrenzyGame() {
  console.log('User opened Flappy Frenzy game');
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Bird physics
  const birdY = useSharedValue(SCREEN_HEIGHT / 2 - 100);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);

  // Pipes
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const pipeGenerationTimer = useRef<NodeJS.Timeout | null>(null);

  // Game loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Colors based on theme
  const colors = {
    background: isDark ? '#1a1a2e' : '#87CEEB',
    bird: '#FFD700',
    birdAccent: '#FFA500',
    pipe: isDark ? '#2ecc71' : '#228B22',
    pipeAccent: isDark ? '#27ae60' : '#1a6b14',
    ground: isDark ? '#34495e' : '#8B4513',
    groundAccent: isDark ? '#2c3e50' : '#654321',
    text: isDark ? '#ecf0f1' : '#2c3e50',
    overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    button: isDark ? '#3498db' : '#2980b9',
    buttonText: '#ffffff',
  };

  // Animated styles
  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: birdY.value },
        { rotate: `${birdRotation.value}deg` },
      ],
    };
  });

  // Start game
  const startGame = () => {
    console.log('User started new game');
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    birdY.value = SCREEN_HEIGHT / 2 - 100;
    birdVelocity.current = 0;
    birdRotation.value = 0;
    setPipes([]);
    
    // Start pipe generation
    pipeGenerationTimer.current = setInterval(() => {
      generatePipe();
    }, 2000);

    // Start game loop
    startGameLoop();
  };

  // Generate new pipe
  const generatePipe = () => {
    const minHeight = 100;
    const maxHeight = SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    setPipes((prevPipes) => [
      ...prevPipes,
      {
        x: SCREEN_WIDTH,
        topHeight,
        passed: false,
      },
    ]);
  };

  // Game loop
  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      // Update bird physics
      birdVelocity.current += GRAVITY;
      birdY.value += birdVelocity.current;

      // Update bird rotation based on velocity
      const targetRotation = Math.min(Math.max(birdVelocity.current * 3, -30), 90);
      birdRotation.value = withTiming(targetRotation, { duration: 100 });

      // Check ground collision
      if (birdY.value > SCREEN_HEIGHT - GROUND_HEIGHT - BIRD_SIZE) {
        endGame();
      }

      // Check ceiling collision
      if (birdY.value < 0) {
        endGame();
      }

      // Update pipes
      setPipes((prevPipes) => {
        const updatedPipes = prevPipes
          .map((pipe) => {
            const newX = pipe.x - PIPE_SPEED;

            // Check if bird passed pipe
            if (!pipe.passed && newX + PIPE_WIDTH < SCREEN_WIDTH / 2 - BIRD_SIZE / 2) {
              setScore((s) => s + 1);
              return { ...pipe, x: newX, passed: true };
            }

            // Check collision with pipe
            const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2;
            const birdRight = SCREEN_WIDTH / 2 + BIRD_SIZE / 2;
            const birdTop = birdY.value;
            const birdBottom = birdY.value + BIRD_SIZE;

            const pipeLeft = newX;
            const pipeRight = newX + PIPE_WIDTH;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Bird is horizontally aligned with pipe
              if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                endGame();
              }
            }

            return { ...pipe, x: newX };
          })
          .filter((pipe) => pipe.x > -PIPE_WIDTH);

        return updatedPipes;
      });
    }, 1000 / 60); // 60 FPS
  };

  // End game
  const endGame = () => {
    console.log('Game over - Score:', score);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    if (pipeGenerationTimer.current) {
      clearInterval(pipeGenerationTimer.current);
    }
    setGameOver(true);
    setGameStarted(false);
    
    if (score > highScore) {
      setHighScore(score);
      console.log('New high score:', score);
    }
  };

  // Jump
  const jump = () => {
    if (!gameStarted || gameOver) return;
    console.log('User tapped to jump');
    birdVelocity.current = JUMP_VELOCITY;
    birdRotation.value = withSequence(
      withTiming(-30, { duration: 100 }),
      withTiming(0, { duration: 200 })
    );
  };

  // Tap gesture
  const tapGesture = Gesture.Tap().onStart(() => {
    runOnJS(jump)();
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (pipeGenerationTimer.current) {
        clearInterval(pipeGenerationTimer.current);
      }
    };
  }, []);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
        </View>

        {/* Bird */}
        <Animated.View style={[styles.bird, birdStyle, { backgroundColor: colors.bird }]}>
          <View style={[styles.birdWing, { backgroundColor: colors.birdAccent }]} />
          <View style={[styles.birdEye, { backgroundColor: '#000' }]} />
        </Animated.View>

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            {/* Top pipe */}
            <View
              style={[
                styles.pipe,
                {
                  left: pipe.x,
                  top: 0,
                  height: pipe.topHeight,
                  backgroundColor: colors.pipe,
                  borderRightColor: colors.pipeAccent,
                },
              ]}
            >
              <View style={[styles.pipeTop, { backgroundColor: colors.pipe, borderColor: colors.pipeAccent }]} />
            </View>

            {/* Bottom pipe */}
            <View
              style={[
                styles.pipe,
                {
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  height: SCREEN_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT,
                  backgroundColor: colors.pipe,
                  borderRightColor: colors.pipeAccent,
                },
              ]}
            >
              <View style={[styles.pipeBottom, { backgroundColor: colors.pipe, borderColor: colors.pipeAccent }]} />
            </View>
          </React.Fragment>
        ))}

        {/* Ground */}
        <View style={[styles.ground, { backgroundColor: colors.ground }]}>
          <View style={[styles.groundPattern, { backgroundColor: colors.groundAccent }]} />
        </View>

        {/* Start/Game Over overlay */}
        {(!gameStarted || gameOver) && (
          <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.title, { color: colors.text }]}>Flappy Frenzy</Text>
            
            {gameOver && (
              <View style={styles.gameOverContainer}>
                <Text style={[styles.gameOverText, { color: colors.text }]}>Game Over!</Text>
                <Text style={[styles.finalScore, { color: colors.text }]}>Score: {score}</Text>
                <Text style={[styles.highScoreText, { color: colors.text }]}>High Score: {highScore}</Text>
              </View>
            )}

            {!gameStarted && !gameOver && (
              <Text style={[styles.instructions, { color: colors.text }]}>
                Tap anywhere to start{'\n'}Keep tapping to fly!
              </Text>
            )}

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.button }]}
              onPress={startGame}
            >
              <Text style={[styles.startButtonText, { color: colors.buttonText }]}>
                {gameOver ? 'Play Again' : 'Start Game'}
              </Text>
            </TouchableOpacity>

            {highScore > 0 && !gameOver && (
              <Text style={[styles.highScoreSmall, { color: colors.text }]}>
                High Score: {highScore}
              </Text>
            )}
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 60 : 80,
    alignSelf: 'center',
    zIndex: 100,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  bird: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - BIRD_SIZE / 2,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  birdWing: {
    position: 'absolute',
    right: -8,
    top: BIRD_SIZE / 2 - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  birdEye: {
    position: 'absolute',
    right: 8,
    top: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    borderRightWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pipeTop: {
    position: 'absolute',
    bottom: -20,
    left: -5,
    width: PIPE_WIDTH + 10,
    height: 30,
    borderRadius: 4,
    borderWidth: 3,
  },
  pipeBottom: {
    position: 'absolute',
    top: -20,
    left: -5,
    width: PIPE_WIDTH + 10,
    height: 30,
    borderRadius: 4,
    borderWidth: 3,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GROUND_HEIGHT,
    borderTopWidth: 4,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
  },
  groundPattern: {
    flex: 1,
    opacity: 0.3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
    lineHeight: 26,
  },
  gameOverContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 24,
    marginBottom: 5,
  },
  highScoreText: {
    fontSize: 20,
    opacity: 0.8,
  },
  highScoreSmall: {
    fontSize: 16,
    marginTop: 20,
    opacity: 0.7,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
