import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import ProgressBar from '../components/ProgressBar';
import SwipeCard from '../components/SwipeCard';

export default function Trial() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [trials, setTrials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageShownAt = useRef(Date.now());

  // Load session from localStorage
  useEffect(() => {
    const sid = localStorage.getItem('session_id');
    const trialsJson = localStorage.getItem('trials');
    const idx = parseInt(localStorage.getItem('current_index') || '0', 10);

    if (!sid || !trialsJson) {
      navigate('/');
      return;
    }

    const parsedTrials = JSON.parse(trialsJson);
    setSessionId(sid);
    setTrials(parsedTrials);
    setCurrentIndex(idx);
  }, [navigate]);

  // Reset timer when trial changes
  useEffect(() => {
    imageShownAt.current = Date.now();
    setImageLoaded(false);
  }, [currentIndex]);

  // Preload next 2 images
  useEffect(() => {
    if (trials.length === 0) return;
    for (let offset = 1; offset <= 2; offset++) {
      const nextIdx = currentIndex + offset;
      if (nextIdx < trials.length) {
        const img = new Image();
        img.src = `/images/${trials[nextIdx].path}`;
      }
    }
  }, [currentIndex, trials]);

  const handleResponse = useCallback((response) => {
    if (trials.length === 0 || currentIndex >= trials.length) return;

    const trial = trials[currentIndex];
    const responseTimeMs = Date.now() - imageShownAt.current;

    // Fire and forget
    fetch('/api/session/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        trial_index: currentIndex,
        image_id: trial.id,
        label: trial.label,
        response,
        response_time_ms: responseTimeMs,
      }),
    }).catch(console.error);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= trials.length) {
      // Complete session
      fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(console.error);

      localStorage.setItem('current_index', String(nextIndex));
      navigate('/done');
    } else {
      setCurrentIndex(nextIndex);
      localStorage.setItem('current_index', String(nextIndex));
    }
  }, [trials, currentIndex, sessionId, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') handleResponse('real');
      else if (e.key === 'ArrowRight') handleResponse('fake');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleResponse]);

  if (trials.length === 0) return null;
  if (currentIndex >= trials.length) return null;

  const currentTrial = trials[currentIndex];

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Color Turing Test
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {currentIndex + 1} / {trials.length}
          </Typography>
        </Box>
        <ProgressBar current={currentIndex + 1} total={trials.length} />
      </Box>

      {/* Main image area */}
      <SwipeCard
        onSwipeLeft={() => handleResponse('real')}
        onSwipeRight={() => handleResponse('fake')}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            minHeight: 0,
          }}
        >
          {/* Fixed-size container — all images render at the same visual footprint */}
          <Box
            sx={{
              width: { xs: 'min(90vw, 90vh - 200px)', md: 'min(60vw, calc(100vh - 240px))' },
              height: { xs: 'min(90vw, 90vh - 200px)', md: 'min(60vw, calc(100vh - 240px))' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'grey.900',
            }}
          >
            <Box
              component="img"
              key={currentTrial.path}
              src={`/images/${currentTrial.path}`}
              alt="Test image"
              onLoad={() => {
                setImageLoaded(true);
                imageShownAt.current = Date.now();
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.15s ease-in',
              }}
            />
          </Box>
        </Box>
      </SwipeCard>

      {/* Bottom area */}
      <Box sx={{ p: 2, pb: 3 }}>
        {/* Mobile: swipe hint + smaller tap buttons as fallback */}
        {!isDesktop && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mb: 1.5, opacity: 0.5, fontSize: '0.72rem', letterSpacing: 1 }}
          >
            absent &#8592; swipe &#8594; present
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            size={isDesktop ? 'large' : 'medium'}
            onClick={() => handleResponse('real')}
            sx={{
              flex: 1,
              maxWidth: 240,
              fontSize: isDesktop ? '1.1rem' : '0.95rem',
              py: isDesktop ? 1.5 : 1,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 },
            }}
          >
            &#x2717; ABSENT
          </Button>
          <Button
            variant="outlined"
            color="success"
            size={isDesktop ? 'large' : 'medium'}
            onClick={() => handleResponse('fake')}
            sx={{
              flex: 1,
              maxWidth: 240,
              fontSize: isDesktop ? '1.1rem' : '0.95rem',
              py: isDesktop ? 1.5 : 1,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 },
            }}
          >
            &#x2713; PRESENT
          </Button>
        </Box>

        {/* Desktop: keyboard hint */}
        {isDesktop && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mt: 1.5, opacity: 0.5, fontSize: '0.7rem' }}
          >
            &larr; Absent &nbsp;&nbsp;&nbsp;&nbsp; Present &rarr;
          </Typography>
        )}
      </Box>
    </Box>
  );
}
