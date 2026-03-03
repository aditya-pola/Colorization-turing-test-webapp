import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Fade, TextField
} from '@mui/material';

const PLATES = [
  {
    src: '/tutorial/colorblind/plate_demo.png',
    question: 'What number do you see?',
    options: ['12', '4', '10', "I can't tell"],
    correctAnswer: '12',
  },
  {
    src: '/tutorial/colorblind/plate_redgreen.png',
    question: 'What number do you see?',
    options: ['74', '21', "I can't tell", 'Something else'],
    correctAnswer: '74',
    field: 'cb_redgreen',
  },
  {
    src: '/tutorial/colorblind/plate_blueyellow.png',
    question: 'What number do you see?',
    options: ['6', "I can't tell", '8', 'I see nothing'],
    correctAnswer: '6',
    field: 'cb_blueyellow',
  },
];

function classifyAnswer(plate, answer) {
  if (answer === plate.correctAnswer) return 'normal';
  if (answer === "I can't tell" || answer === 'I see nothing' || answer === 'Something else')
    return 'unsure';
  return 'deficient';
}

function detectDevice() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export default function Welcome() {
  const navigate = useNavigate();
  const [plateStep, setPlateStep] = useState(0);
  const [plateAnswers, setPlateAnswers] = useState(['', '', '']);
  const [expertise, setExpertise] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const allPlatesDone = plateStep >= PLATES.length;

  const handlePlateAnswer = (answer) => {
    const updated = [...plateAnswers];
    updated[plateStep] = answer;
    setPlateAnswers(updated);
  };

  const handlePlateNext = () => {
    setPlateStep((s) => s + 1);
  };

  const handleStart = async () => {
    if (!allPlatesDone || !expertise) return;
    setLoading(true);

    // Classify colorblindness results
    const cbRedgreen = classifyAnswer(PLATES[1], plateAnswers[1]);
    const cbBlueyellow = classifyAnswer(PLATES[2], plateAnswers[2]);
    const colorblind =
      cbRedgreen !== 'normal' || cbBlueyellow !== 'normal' ? 1 : 0;
    const device = detectDevice();

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertise,
          email: email.trim(),
          colorblind,
          device,
          cb_redgreen: cbRedgreen,
          cb_blueyellow: cbBlueyellow,
        }),
      });
      const data = await res.json();

      localStorage.setItem('session_id', data.session_id);
      localStorage.setItem('trials', JSON.stringify(data.trials));
      localStorage.setItem('current_index', '0');

      navigate('/tutorial');
    } catch (err) {
      console.error('Failed to start session:', err);
      setLoading(false);
    }
  };

  const currentPlate = !allPlatesDone ? PLATES[plateStep] : null;
  const currentAnswer = !allPlatesDone ? plateAnswers[plateStep] : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 520, width: '100%' }}>
        <CardContent
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography
            variant="h3"
            textAlign="center"
            sx={{ fontSize: { xs: '1.8rem', sm: '2.4rem' } }}
          >
            Can you spot colorization artifacts?
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Look at 50 images and decide: are colorization artifacts present or absent?
            Takes about 5 minutes.
          </Typography>

          {/* Colorblindness plates — sequential */}
          {!allPlatesDone && currentPlate && (
            <Fade in key={plateStep} timeout={300}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ opacity: 0.6 }}
                >
                  Vision check {plateStep + 1} of {PLATES.length}
                </Typography>

                <Box
                  component="img"
                  src={currentPlate.src}
                  alt="Color vision test plate"
                  sx={{
                    width: 300,
                    height: 300,
                    objectFit: 'contain',
                    borderRadius: '50%',
                  }}
                />

                <Typography variant="body2" color="text.secondary">
                  {currentPlate.question}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {currentPlate.options.map((opt) => (
                    <Button
                      key={opt}
                      variant={currentAnswer === opt ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handlePlateAnswer(opt)}
                      sx={{ minWidth: 80 }}
                    >
                      {opt}
                    </Button>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  disabled={!currentAnswer}
                  onClick={handlePlateNext}
                  sx={{ mt: 0.5 }}
                >
                  Next &rarr;
                </Button>
              </Box>
            </Fade>
          )}

          {/* Expertise + Start — shown after all plates */}
          {allPlatesDone && (
            <Fade in timeout={300}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  width: '100%',
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Your background</InputLabel>
                  <Select
                    value={expertise}
                    label="Your background"
                    onChange={(e) => setExpertise(e.target.value)}
                  >
                    <MenuItem value="General public">General public</MenuItem>
                    <MenuItem value="Photographer / Artist">
                      Photographer / Artist
                    </MenuItem>
                    <MenuItem value="Researcher / Academic">
                      Researcher / Academic
                    </MenuItem>
                    <MenuItem value="Computer Vision / ML expert">
                      Computer Vision / ML expert
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Email address (optional)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  helperText="Only used if we need to follow up. Leave blank to stay anonymous."
                  variant="outlined"
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!expertise || loading}
                  onClick={handleStart}
                  sx={{ mt: 1 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Start \u2192'
                  )}
                </Button>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
