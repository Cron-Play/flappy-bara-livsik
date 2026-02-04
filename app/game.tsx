
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional AdMob import for native platforms only
let BannerAd: any = null;
let BannerAdSize: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
let adMobModule: any = null;

if (Platform.OS !== 'web') {
  try {
    adMobModule = require('react-native-google-mobile-ads');
    BannerAd = adMobModule.BannerAd;
    BannerAdSize = adMobModule.BannerAdSize;
    InterstitialAd = adMobModule.InterstitialAd;
    AdEventType = adMobModule.AdEventType;
    TestIds = adMobModule.TestIds;
  } catch (error) {
    console.warn('react-native-google-mobile-ads not available:', error);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants - ADJUSTED FOR SMOOTHER, LESS VIOLENT GAMEPLAY
const BIRD_SIZE = 70;
const GRAVITY = 0.4;
const JUMP_VELOCITY = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 1.5;
const GROUND_HEIGHT = 100;

// Cloud configuration
const NUM_CLOUDS = 8;
const CLOUD_MIN_SIZE = 80;
const CLOUD_MAX_SIZE = 150;
const CLOUD_MIN_SPEED = 0.3;
const CLOUD_MAX_SPEED = 0.8;

const HIGH_SCORE_KEY = '@flappybara_high_score';
const GAME_COUNT_KEY = '@flappybara_game_count';

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export default function FlappybaraGame() {
  console.log('User opened Flappybara game');
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameCount, setGameCount] = useState(0);
  const [adMobInitialized, setAdMobInitialized] = useState(false);

  // Interstitial ad state
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const interstitialAdRef = useRef<any>(null);
  const adEventUnsubscribers = useRef<Array<() => void>>([]);

  // Bird physics
  const birdY = useSharedValue(SCREEN_HEIGHT / 2 - 100);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);

  // Pipes
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const pipeGenerationTimer = useRef<NodeJS.Timeout | null>(null);

  // Clouds
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const cloudUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Game loop
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(Date.now());

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
    cloud: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
  };

  // Initialize AdMob
  useEffect(() => {
    if (Platform.OS !== 'web' && adMobModule) {
      adMobModule
        .default()
        .initialize()
        .then((status: any) => {
          console.log('AdMob initialized:', status);
          setAdMobInitialized(true);
        })
        .catch((error: any) => {
          console.error('AdMob initialization failed:', error);
        });
    }
  }, []);

  // Load high score and game count from storage on mount
  useEffect(() => {
    loadHighScore();
    loadGameCount();
  }, []);

  // Initialize interstitial ad after AdMob is initialized
  useEffect(() => {
    if (adMobInitialized && Platform.OS !== 'web' && InterstitialAd && TestIds) {
      loadInterstitialAd();
    }
    
    return () => {
      // Cleanup ad event listeners
      adEventUnsubscribers.current.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from ad event:', error);
        }
      });
      adEventUnsubscribers.current = [];
    };
  }, [adMobInitialized]);

  const loadInterstitialAd = useCallback(() => {
    if (Platform.OS === 'web' || !InterstitialAd || !TestIds) {
      return;
    }

    try {
      // Create interstitial ad instance
      const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Set up event listeners
      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
        setInterstitialLoaded(true);
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        setInterstitialLoaded(false);
        // Load next ad
        loadInterstitialAd();
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Interstitial ad error:', error);
        setInterstitialLoaded(false);
        // Try to load again after error
        setTimeout(() => loadInterstitialAd(), 5000);
      });

      // Store unsubscribers for cleanup
      adEventUnsubscribers.current.push(unsubscribeLoaded, unsubscribeClosed, unsubscribeError);

      // Load the ad
      interstitial.load();
      interstitialAdRef.current = interstitial;
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
    }
  }, []);

  const showInterstitialAd = useCallback(() => {
    if (Platform.OS === 'web' || !interstitialAdRef.current || !interstitialLoaded) {
      console.log('Interstitial ad not ready to show');
      return;
    }

    try {
      console.log('Showing interstitial ad');
      interstitialAdRef.current.show();
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    }
  }, [interstitialLoaded]);

  const loadHighScore = async () => {
    try {
      const savedHighScore = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (savedHighScore !== null) {
        const parsedScore = parseInt(savedHighScore, 10);
        setHighScore(parsedScore);
        console.log('Loaded high score from storage:', parsedScore);
      }
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  };

  const saveHighScore = async (newHighScore: number) => {
    try {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
      console.log('Saved new high score to storage:', newHighScore);
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  const loadGameCount = async () => {
    try {
      const savedGameCount = await AsyncStorage.getItem(GAME_COUNT_KEY);
      if (savedGameCount !== null) {
        const parsedCount = parseInt(savedGameCount, 10);
        setGameCount(parsedCount);
        console.log('Loaded game count from storage:', parsedCount);
      }
    } catch (error) {
      console.error('Error loading game count:', error);
    }
  };

  const incrementGameCount = async () => {
    try {
      const newCount = gameCount + 1;
      setGameCount(newCount);
      await AsyncStorage.setItem(GAME_COUNT_KEY, newCount.toString());
      console.log('Game count incremented to:', newCount);
      
      // Show interstitial ad every 3rd game
      if (newCount % 3 === 0) {
        console.log('Showing interstitial ad after 3rd game');
        showInterstitialAd();
      }
    } catch (error) {
      console.error('Error incrementing game count:', error);
    }
  };

  // Initialize clouds on mount
  useEffect(() => {
    const initialClouds: Cloud[] = [];
    for (let i = 0; i < NUM_CLOUDS; i++) {
      initialClouds.push({
        x: (SCREEN_WIDTH / NUM_CLOUDS) * i + Math.random() * (SCREEN_WIDTH / NUM_CLOUDS),
        y: Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - 250) + 50,
        size: Math.random() * (CLOUD_MAX_SIZE - CLOUD_MIN_SIZE) + CLOUD_MIN_SIZE,
        speed: Math.random() * (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) + CLOUD_MIN_SPEED,
      });
    }
    setClouds(initialClouds);

    // Start cloud animation
    cloudUpdateTimer.current = setInterval(() => {
      setClouds((prevClouds) =>
        prevClouds.map((cloud) => {
          let newX = cloud.x - cloud.speed;
          if (newX < -cloud.size - 50) {
            newX = SCREEN_WIDTH + 50;
          }
          return { ...cloud, x: newX };
        })
      );
    }, 1000 / 30);

    return () => {
      if (cloudUpdateTimer.current) {
        clearInterval(cloudUpdateTimer.current);
      }
    };
  }, []);

  // Animated styles
  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: birdY.value },
        { rotate: `${birdRotation.value}deg` },
      ],
    };
  });

  // End game callback
  const endGame = useCallback(() => {
    console.log('Game over - Score:', score);
    
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    if (pipeGenerationTimer.current) {
      clearInterval(pipeGenerationTimer.current);
      pipeGenerationTimer.current = null;
    }
    
    setGameOver(true);
    setGameStarted(false);
    
    // Increment game count and potentially show ad
    incrementGameCount();
    
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
      console.log('New high score:', score);
    }
  }, [score, highScore, gameCount, showInterstitialAd]);

  // Game loop using requestAnimationFrame for smooth performance
  const gameLoop = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastFrameTime.current) / 16.67; // Normalize to 60fps
    lastFrameTime.current = now;

    // Update bird physics
    birdVelocity.current += GRAVITY * deltaTime;
    const newBirdY = birdY.value + birdVelocity.current * deltaTime;
    birdY.value = newBirdY;

    // Update bird rotation based on velocity
    const targetRotation = Math.min(Math.max(birdVelocity.current * 2.5, -25), 70);
    birdRotation.value = withTiming(targetRotation, { duration: 150 });

    // Collision detection with margin
    const collisionMargin = 5;
    const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2 + collisionMargin;
    const birdRight = SCREEN_WIDTH / 2 + BIRD_SIZE / 2 - collisionMargin;
    const birdTop = newBirdY + collisionMargin;
    const birdBottom = newBirdY + BIRD_SIZE - collisionMargin;

    // Check ground collision
    if (birdBottom >= SCREEN_HEIGHT - GROUND_HEIGHT) {
      console.log('Collision detected: Bird hit ground');
      endGame();
      return;
    }

    // Check ceiling collision
    if (birdTop <= 0) {
      console.log('Collision detected: Bird hit ceiling');
      endGame();
      return;
    }

    // Update pipes and check collisions
    let shouldEndGame = false;
    let newScore = score;

    setPipes((prevPipes) => {
      const updatedPipes = prevPipes
        .map((pipe) => {
          const newX = pipe.x - PIPE_SPEED * deltaTime;

          // Check if bird passed pipe
          if (!pipe.passed && newX + PIPE_WIDTH < SCREEN_WIDTH / 2 - BIRD_SIZE / 2) {
            newScore = score + 1;
            return { ...pipe, x: newX, passed: true };
          }

          // Collision detection
          const pipeLeft = newX;
          const pipeRight = newX + PIPE_WIDTH;

          const horizontalOverlap = birdRight > pipeLeft && birdLeft < pipeRight;

          if (horizontalOverlap) {
            const hitTopPipe = birdTop < pipe.topHeight;
            const hitBottomPipe = birdBottom > pipe.topHeight + PIPE_GAP;

            if (hitTopPipe || hitBottomPipe) {
              console.log('Collision detected: Bird hit pipe at x:', newX);
              shouldEndGame = true;
            }
          }

          return { ...pipe, x: newX };
        })
        .filter((pipe) => pipe.x > -PIPE_WIDTH);

      return updatedPipes;
    });

    // Update score if changed
    if (newScore !== score) {
      setScore(newScore);
    }

    // End game if collision detected
    if (shouldEndGame) {
      endGame();
      return;
    }

    // Continue game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [score, endGame]);

  // Start game
  const startGame = useCallback(() => {
    console.log('User started new game');
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    birdY.value = SCREEN_HEIGHT / 2 - 100;
    birdVelocity.current = 0;
    birdRotation.value = 0;
    setPipes([]);
    lastFrameTime.current = Date.now();
    
    // Start pipe generation
    pipeGenerationTimer.current = setInterval(() => {
      generatePipe();
    }, 2000);

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

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

  // Jump
  const jump = useCallback(() => {
    if (!gameStarted || gameOver) return;
    console.log('User tapped to jump');
    birdVelocity.current = JUMP_VELOCITY;
    birdRotation.value = withSequence(
      withTiming(-25, { duration: 150 }),
      withTiming(0, { duration: 250 })
    );
  }, [gameStarted, gameOver]);

  // Handle screen tap
  const handleScreenTap = useCallback(() => {
    console.log('User tapped screen');
    if (gameStarted && !gameOver) {
      jump();
    }
  }, [gameStarted, gameOver, jump]);

  // Tap gesture for the entire screen
  const tapGesture = Gesture.Tap().onStart(() => {
    handleScreenTap();
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (pipeGenerationTimer.current) {
        clearInterval(pipeGenerationTimer.current);
      }
    };
  }, []);

  // Atomic JSX - calculate text values outside JSX
  const gameCountText = `Games played: ${gameCount}`;
  const gamesUntilAd = 3 - (gameCount % 3);
  const nextAdText = gameCount % 3 === 0 ? 'Ad shown!' : `Next ad in ${gamesUntilAd} games`;
  const highScoreDisplayText = `High Score: ${highScore}`;
  const finalScoreText = `Score: ${score}`;
  const instructionsLine1 = 'Tap anywhere to start';
  const instructionsLine2 = 'Keep tapping to fly!';
  const startButtonText = gameOver ? 'Play Again' : 'Start Game';

  return (
    <View style={styles.wrapper}>
      {/* AdMob Banner at the top - only on native platforms */}
      {Platform.OS !== 'web' && BannerAd && TestIds && adMobInitialized && (
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              console.log('Banner ad loaded');
            }}
            onAdFailedToLoad={(error: any) => {
              console.error('Banner ad failed to load:', error);
            }}
          />
        </View>
      )}
      
      <GestureDetector gesture={tapGesture}>
        <Pressable 
          style={[styles.container, { backgroundColor: colors.background }]}
          onPress={handleScreenTap}
        >
          {/* Clouds in background */}
          {clouds.map((cloud, index) => {
            const cloudLeftPos = cloud.x;
            const cloudTopPos = cloud.y;
            const cloudWidth = cloud.size;
            const cloudHeight = cloud.size * 0.6;
            const cloudColor = colors.cloud;
            
            const cloudPart1Left = cloud.size * 0.2;
            const cloudPart1Top = cloud.size * 0.1;
            const cloudPart1Width = cloud.size * 0.4;
            const cloudPart1Height = cloud.size * 0.4;
            
            const cloudPart2Right = cloud.size * 0.2;
            const cloudPart2Top = cloud.size * 0.05;
            const cloudPart2Width = cloud.size * 0.35;
            const cloudPart2Height = cloud.size * 0.35;
            
            return (
              <View
                key={index}
                style={[
                  styles.cloud,
                  {
                    left: cloudLeftPos,
                    top: cloudTopPos,
                    width: cloudWidth,
                    height: cloudHeight,
                    backgroundColor: cloudColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cloudPart,
                    {
                      left: cloudPart1Left,
                      top: cloudPart1Top,
                      width: cloudPart1Width,
                      height: cloudPart1Height,
                      backgroundColor: cloudColor,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cloudPart,
                    {
                      right: cloudPart2Right,
                      top: cloudPart2Top,
                      width: cloudPart2Width,
                      height: cloudPart2Height,
                      backgroundColor: cloudColor,
                    },
                  ]}
                />
              </View>
            );
          })}

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
          </View>

          {/* Capybara */}
          <Animated.View style={[styles.bird, birdStyle]}>
            <Image
              source={require('@/assets/images/52b1c166-be40-4bd1-be77-9f6625ab8726.png')}
              style={styles.capybaraImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Pipes */}
          {pipes.map((pipe, index) => {
            const pipeLeft = pipe.x;
            const pipeTopHeight = pipe.topHeight;
            const pipeBottomTop = pipe.topHeight + PIPE_GAP;
            const pipeBottomHeight = SCREEN_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT;
            const pipeColor = colors.pipe;
            const pipeAccentColor = colors.pipeAccent;
            
            return (
              <React.Fragment key={index}>
                {/* Top pipe */}
                <View
                  style={[
                    styles.pipe,
                    {
                      left: pipeLeft,
                      top: 0,
                      height: pipeTopHeight,
                      backgroundColor: pipeColor,
                      borderRightColor: pipeAccentColor,
                    },
                  ]}
                >
                  <View style={[styles.pipeTop, { backgroundColor: pipeColor, borderColor: pipeAccentColor }]} />
                </View>

                {/* Bottom pipe */}
                <View
                  style={[
                    styles.pipe,
                    {
                      left: pipeLeft,
                      top: pipeBottomTop,
                      height: pipeBottomHeight,
                      backgroundColor: pipeColor,
                      borderRightColor: pipeAccentColor,
                    },
                  ]}
                >
                  <View style={[styles.pipeBottom, { backgroundColor: pipeColor, borderColor: pipeAccentColor }]} />
                </View>
              </React.Fragment>
            );
          })}

          {/* Ground */}
          <View style={[styles.ground, { backgroundColor: colors.ground }]}>
            <View style={[styles.groundPattern, { backgroundColor: colors.groundAccent }]} />
          </View>

          {/* Start/Game Over overlay */}
          {(!gameStarted || gameOver) && (
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
              <Text style={[styles.title, { color: colors.text }]}>Flappybara</Text>
              
              {gameOver && (
                <View style={styles.gameOverContainer}>
                  <Text style={[styles.gameOverText, { color: colors.text }]}>Game Over!</Text>
                  <Text style={[styles.finalScore, { color: colors.text }]}>{finalScoreText}</Text>
                  <Text style={[styles.highScoreText, { color: colors.text }]}>{highScoreDisplayText}</Text>
                  <Text style={[styles.adInfoText, { color: colors.text }]}>{gameCountText}</Text>
                  <Text style={[styles.adInfoText, { color: colors.text }]}>{nextAdText}</Text>
                </View>
              )}

              {!gameStarted && !gameOver && (
                <View style={styles.instructionsContainer}>
                  <Text style={[styles.instructions, { color: colors.text }]}>{instructionsLine1}</Text>
                  <Text style={[styles.instructions, { color: colors.text }]}>{instructionsLine2}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.button }]}
                onPress={startGame}
              >
                <Text style={[styles.startButtonText, { color: colors.buttonText }]}>
                  {startButtonText}
                </Text>
              </TouchableOpacity>

              {highScore > 0 && !gameOver && (
                <Text style={[styles.highScoreSmall, { color: colors.text }]}>
                  {highScoreDisplayText}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    zIndex: 1000,
  },
  container: {
    flex: 1,
  },
  scoreContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 120 : 140,
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
    zIndex: 10,
  },
  capybaraImage: {
    width: '100%',
    height: '100%',
  },
  cloud: {
    position: 'absolute',
    borderRadius: 100,
    zIndex: 1,
  },
  cloudPart: {
    position: 'absolute',
    borderRadius: 100,
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
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
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
    marginBottom: 10,
  },
  adInfoText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 5,
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
