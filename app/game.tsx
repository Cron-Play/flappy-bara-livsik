
import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import AdMob only on native platforms
let mobileAds: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let RewardedAd: any = null;
let RewardedAdEventType: any = null;

if (Platform.OS !== 'web') {
  try {
    const adMobModule = require('react-native-google-mobile-ads');
    mobileAds = adMobModule.default;
    BannerAd = adMobModule.BannerAd;
    BannerAdSize = adMobModule.BannerAdSize;
    TestIds = adMobModule.TestIds;
    InterstitialAd = adMobModule.InterstitialAd;
    AdEventType = adMobModule.AdEventType;
    RewardedAd = adMobModule.RewardedAd;
    RewardedAdEventType = adMobModule.RewardedAdEventType;
  } catch (error) {
    console.log('AdMob not available:', error);
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
const RUN_COUNT_KEY = '@flappybara_run_count';

// AdMob Ad Unit IDs (using test IDs for development)
const BANNER_AD_UNIT_ID = Platform.OS !== 'web' && __DEV__ && TestIds ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const INTERSTITIAL_AD_UNIT_ID = Platform.OS !== 'web' && __DEV__ && TestIds ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const REWARDED_AD_UNIT_ID = Platform.OS !== 'web' && __DEV__ && TestIds ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

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

// Create interstitial ad instance (only on native)
let interstitialAd: any = null;
let rewardedAd: any = null;

if (Platform.OS !== 'web' && InterstitialAd && RewardedAd) {
  try {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
  } catch (error) {
    console.log('Error creating ad instances:', error);
  }
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
  const [runCount, setRunCount] = useState(0);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState(false);
  const [hasUsedContinue, setHasUsedContinue] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);

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
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Colors based on theme
  const skyColor = isDark ? '#1a1a2e' : '#87CEEB';
  const birdColor = '#FFD700';
  const birdAccentColor = '#FFA500';
  const pipeColor = isDark ? '#2ecc71' : '#228B22';
  const pipeAccentColor = isDark ? '#27ae60' : '#1a6b14';
  const groundColor = isDark ? '#34495e' : '#8B4513';
  const groundAccentColor = isDark ? '#2c3e50' : '#654321';
  const textColor = isDark ? '#ecf0f1' : '#2c3e50';
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const buttonColor = isDark ? '#3498db' : '#2980b9';
  const buttonTextColor = '#ffffff';
  const cloudColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)';

  // Initialize AdMob and load data on mount
  useEffect(() => {
    if (Platform.OS !== 'web' && mobileAds) {
      initializeAds();
    }
    loadHighScore();
    loadRunCount();
  }, []);

  const initializeAds = async () => {
    if (Platform.OS === 'web' || !mobileAds) {
      console.log('AdMob not available on web platform');
      return;
    }

    try {
      await mobileAds().initialize();
      console.log('AdMob initialized successfully');
      setAdsInitialized(true);
      
      // Load interstitial ad
      loadInterstitialAd();
      
      // Load rewarded ad
      loadRewardedAd();
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  };

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

  const loadRunCount = async () => {
    try {
      const savedRunCount = await AsyncStorage.getItem(RUN_COUNT_KEY);
      if (savedRunCount !== null) {
        const parsedCount = parseInt(savedRunCount, 10);
        setRunCount(parsedCount);
        console.log('Loaded run count from storage:', parsedCount);
      }
    } catch (error) {
      console.error('Error loading run count:', error);
    }
  };

  const saveRunCount = async (newRunCount: number) => {
    try {
      await AsyncStorage.setItem(RUN_COUNT_KEY, newRunCount.toString());
      console.log('Saved run count to storage:', newRunCount);
    } catch (error) {
      console.error('Error saving run count:', error);
    }
  };

  // Load interstitial ad
  const loadInterstitialAd = () => {
    if (Platform.OS === 'web' || !interstitialAd || !AdEventType) {
      return;
    }

    try {
      const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
        setInterstitialLoaded(true);
      });

      const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        setInterstitialLoaded(false);
        interstitialAd.load();
      });

      const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Interstitial ad error:', error);
        setInterstitialLoaded(false);
      });

      interstitialAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
    }
  };

  // Load rewarded ad
  const loadRewardedAd = () => {
    if (Platform.OS === 'web' || !rewardedAd || !RewardedAdEventType || !AdEventType) {
      return;
    }

    try {
      const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('Rewarded ad loaded');
        setRewardedLoaded(true);
      });

      const unsubscribeEarned = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          console.log('User earned reward:', reward);
          continueGame();
        }
      );

      const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Rewarded ad closed');
        setShowRewardedAdModal(false);
        setRewardedLoaded(false);
        rewardedAd.load();
      });

      const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Rewarded ad error:', error);
        setRewardedLoaded(false);
        setShowRewardedAdModal(false);
      });

      rewardedAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
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

  // Start game
  const startGame = () => {
    console.log('User started new game');
    
    const newRunCount = runCount + 1;
    setRunCount(newRunCount);
    saveRunCount(newRunCount);
    
    // Show interstitial ad every 3rd run (only on native)
    if (Platform.OS !== 'web' && newRunCount % 3 === 0 && interstitialLoaded && interstitialAd) {
      console.log('Showing interstitial ad (run #' + newRunCount + ')');
      try {
        interstitialAd.show();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
      }
    }
    
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setHasUsedContinue(false);
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
      const targetRotation = Math.min(Math.max(birdVelocity.current * 2.5, -25), 70);
      birdRotation.value = withTiming(targetRotation, { duration: 150 });

      // Collision detection with margin
      const collisionMargin = 5;
      const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2 + collisionMargin;
      const birdRight = SCREEN_WIDTH / 2 + BIRD_SIZE / 2 - collisionMargin;
      const birdTop = birdY.value + collisionMargin;
      const birdBottom = birdY.value + BIRD_SIZE - collisionMargin;

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

            // Collision detection
            const pipeLeft = newX;
            const pipeRight = newX + PIPE_WIDTH;

            const horizontalOverlap = birdRight > pipeLeft && birdLeft < pipeRight;

            if (horizontalOverlap) {
              const hitTopPipe = birdTop < pipe.topHeight;
              const hitBottomPipe = birdBottom > pipe.topHeight + PIPE_GAP;

              if (hitTopPipe || hitBottomPipe) {
                console.log('Collision detected: Bird hit pipe at x:', newX);
                endGame();
              }
            }

            return { ...pipe, x: newX };
          })
          .filter((pipe) => pipe.x > -PIPE_WIDTH);

        return updatedPipes;
      });
    }, 1000 / 60);
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
    
    // Check if this is the first crash and user hasn't used continue yet (only on native)
    if (Platform.OS !== 'web' && !hasUsedContinue && rewardedLoaded) {
      console.log('First crash - offering rewarded ad to continue');
      setShowRewardedAdModal(true);
      return;
    }
    
    setGameOver(true);
    setGameStarted(false);
    
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
      console.log('New high score:', score);
    }
  };

  // Continue game after watching rewarded ad
  const continueGame = () => {
    console.log('User continuing game after watching ad');
    setHasUsedContinue(true);
    setShowRewardedAdModal(false);
    
    // Reset bird position and velocity
    birdY.value = SCREEN_HEIGHT / 2 - 100;
    birdVelocity.current = 0;
    birdRotation.value = 0;
    
    // Clear pipes and restart
    setPipes([]);
    
    // Restart game loop
    startGameLoop();
  };

  // Handle declining the rewarded ad
  const declineRewardedAd = () => {
    console.log('User declined to watch ad');
    setShowRewardedAdModal(false);
    setGameOver(true);
    setGameStarted(false);
    
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
      console.log('New high score:', score);
    }
  };

  // Watch rewarded ad
  const watchRewardedAd = () => {
    console.log('User chose to watch rewarded ad');
    if (Platform.OS !== 'web' && rewardedLoaded && rewardedAd) {
      try {
        rewardedAd.show();
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        setShowRewardedAdModal(false);
        declineRewardedAd();
      }
    } else {
      console.error('Rewarded ad not loaded yet');
      setShowRewardedAdModal(false);
      declineRewardedAd();
    }
  };

  // Jump
  const jump = () => {
    if (!gameStarted || gameOver) return;
    console.log('User tapped to jump');
    birdVelocity.current = JUMP_VELOCITY;
    birdRotation.value = withSequence(
      withTiming(-25, { duration: 150 }),
      withTiming(0, { duration: 250 })
    );
  };

  // Handle screen tap
  const handleScreenTap = () => {
    if (gameStarted && !gameOver) {
      jump();
    }
  };

  // Tap gesture for the entire screen
  const tapGesture = Gesture.Tap().onStart(() => {
    if (gameStarted && !gameOver) {
      jump();
    }
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
      <Pressable 
        style={[styles.container, { backgroundColor: skyColor }]}
        onPress={handleScreenTap}
      >
        {/* AdMob Banner at top - only on native platforms */}
        {Platform.OS !== 'web' && adsInitialized && BannerAd && BannerAdSize && (
          <View style={styles.bannerContainer}>
            <BannerAd
              unitId={BANNER_AD_UNIT_ID}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          </View>
        )}

        {/* Clouds in background */}
        {clouds.map((cloud, index) => (
          <View key={index}>
            <View
              style={[
                styles.cloud,
                {
                  left: cloud.x,
                  top: cloud.y,
                  width: cloud.size,
                  height: cloud.size * 0.6,
                  backgroundColor: cloudColor,
                },
              ]}
            >
              <View
                style={[
                  styles.cloudPart,
                  {
                    left: cloud.size * 0.2,
                    top: cloud.size * 0.1,
                    width: cloud.size * 0.4,
                    height: cloud.size * 0.4,
                    backgroundColor: cloudColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.cloudPart,
                  {
                    right: cloud.size * 0.2,
                    top: cloud.size * 0.05,
                    width: cloud.size * 0.35,
                    height: cloud.size * 0.35,
                    backgroundColor: cloudColor,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        {/* Score */}
        <View style={[styles.scoreContainer, Platform.OS !== 'web' && adsInitialized && styles.scoreContainerWithBanner]}>
          <Text style={[styles.scoreText, { color: textColor }]}>{score}</Text>
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
        {pipes.map((pipe, index) => (
          <View key={index}>
            {/* Top pipe */}
            <View
              style={[
                styles.pipe,
                {
                  left: pipe.x,
                  top: 0,
                  height: pipe.topHeight,
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
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  height: SCREEN_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT,
                  backgroundColor: pipeColor,
                  borderRightColor: pipeAccentColor,
                },
              ]}
            >
              <View style={[styles.pipeBottom, { backgroundColor: pipeColor, borderColor: pipeAccentColor }]} />
            </View>
          </View>
        ))}

        {/* Ground */}
        <View style={[styles.ground, { backgroundColor: groundColor }]}>
          <View style={[styles.groundPattern, { backgroundColor: groundAccentColor }]} />
        </View>

        {/* Start/Game Over overlay */}
        {(!gameStarted || gameOver) && (
          <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
            <Text style={[styles.title, { color: textColor }]}>Flappybara</Text>
            
            {gameOver && (
              <View style={styles.gameOverContainer}>
                <Text style={[styles.gameOverText, { color: textColor }]}>Game Over!</Text>
                <Text style={[styles.finalScore, { color: textColor }]}>Score: {score}</Text>
                <Text style={[styles.highScoreText, { color: textColor }]}>High Score: {highScore}</Text>
              </View>
            )}

            {!gameStarted && !gameOver && (
              <Text style={[styles.instructions, { color: textColor }]}>
                Tap anywhere to start{'\n'}Keep tapping to fly!
              </Text>
            )}

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: buttonColor }]}
              onPress={startGame}
            >
              <Text style={[styles.startButtonText, { color: buttonTextColor }]}>
                {gameOver ? 'Play Again' : 'Start Game'}
              </Text>
            </TouchableOpacity>

            {highScore > 0 && !gameOver && (
              <Text style={[styles.highScoreSmall, { color: textColor }]}>
                High Score: {highScore}
              </Text>
            )}
          </View>
        )}

        {/* Rewarded Ad Modal - Watch to Continue (only on native) */}
        {Platform.OS !== 'web' && (
          <Modal
            visible={showRewardedAdModal}
            transparent={true}
            animationType="fade"
            onRequestClose={declineRewardedAd}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: overlayColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Game Over!</Text>
                <Text style={[styles.modalScore, { color: textColor }]}>Score: {score}</Text>
                <Text style={[styles.modalMessage, { color: textColor }]}>
                  Watch an ad to continue playing?
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.watchAdButton, { backgroundColor: buttonColor }]}
                    onPress={watchRewardedAd}
                  >
                    <Text style={[styles.modalButtonText, { color: buttonTextColor }]}>
                      Watch Ad
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.declineButton, { backgroundColor: '#e74c3c' }]}
                    onPress={declineRewardedAd}
                  >
                    <Text style={[styles.modalButtonText, { color: buttonTextColor }]}>
                      No Thanks
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scoreContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 60 : 80,
    alignSelf: 'center',
    zIndex: 100,
  },
  scoreContainerWithBanner: {
    top: Platform.OS === 'android' ? 120 : 140,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalScore: {
    fontSize: 24,
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  watchAdButton: {
    marginBottom: 8,
  },
  declineButton: {
    opacity: 0.9,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
