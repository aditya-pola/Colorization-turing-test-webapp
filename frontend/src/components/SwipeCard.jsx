import { useRef, useCallback, useState } from 'react';
import { Box, Typography } from '@mui/material';

const THRESHOLD = 80;   // px to trigger decision
const MAX_ROTATE = 12;  // degrees at full drag
const MAX_DRAG = 180;   // px reference for scale calculations

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight }) {
  const touchStart = useRef(null);
  const [dx, setDx] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null

  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    setExiting(null);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStart.current === null) return;
    const delta = e.touches[0].clientX - touchStart.current;
    setDx(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStart.current === null) return;
    touchStart.current = null;

    if (dx <= -THRESHOLD) {
      setExiting('left');
      setTimeout(() => {
        setDx(0);
        setExiting(null);
        onSwipeLeft?.();
      }, 220);
    } else if (dx >= THRESHOLD) {
      setExiting('right');
      setTimeout(() => {
        setDx(0);
        setExiting(null);
        onSwipeRight?.();
      }, 220);
    } else {
      // snap back
      setDx(0);
    }
  }, [dx, onSwipeLeft, onSwipeRight]);

  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
  const rotate = (dx / MAX_DRAG) * MAX_ROTATE;
  const translateX = exiting === 'left'
    ? -window.innerWidth
    : exiting === 'right'
    ? window.innerWidth
    : dx;

  const isLeft = dx < -10;
  const isRight = dx > 10;
  const overlayOpacity = Math.min(Math.abs(dx) / THRESHOLD, 0.7);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Draggable card */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          transition: exiting
            ? 'transform 0.22s ease-out'
            : dx === 0
            ? 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'none',
        }}
      >
        {children}

        {/* ABSENT overlay — left swipe — red */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 2,
            bgcolor: 'error.main',
            opacity: isLeft ? overlayOpacity * 0.35 : 0,
            transition: 'opacity 0.1s',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 24,
            transform: 'translateY(-50%) rotate(-15deg)',
            opacity: isLeft ? Math.min(progress * 1.4, 1) : 0,
            transition: 'opacity 0.1s',
            pointerEvents: 'none',
            border: '3px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={900}
            color="error.main"
            sx={{ letterSpacing: 2 }}
          >
            ABSENT
          </Typography>
        </Box>

        {/* PRESENT overlay — right swipe — green */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 2,
            bgcolor: 'success.main',
            opacity: isRight ? overlayOpacity * 0.35 : 0,
            transition: 'opacity 0.1s',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 24,
            transform: 'translateY(-50%) rotate(15deg)',
            opacity: isRight ? Math.min(progress * 1.4, 1) : 0,
            transition: 'opacity 0.1s',
            pointerEvents: 'none',
            border: '3px solid',
            borderColor: 'success.main',
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={900}
            color="success.main"
            sx={{ letterSpacing: 2 }}
          >
            PRESENT
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
