import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, Fade
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ARTIFACT_CHIPS = [
  'Grayish', 'Color bleeding', 'Inconsistency',
  'Color artifacts', 'Incomplete', 'Wrong hue'
];

function StepDots({ current, total }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: i === current ? 'primary.main' : 'rgba(255,255,255,0.2)',
            transition: 'background-color 0.3s',
          }}
        />
      ))}
    </Box>
  );
}

function AnswerButtons({ onAnswer, disabled }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
      <Button
        variant="outlined"
        color="error"
        size="large"
        disabled={disabled}
        onClick={() => onAnswer('real')}
        sx={{
          flex: 1,
          maxWidth: 220,
          fontSize: '1rem',
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        }}
      >
        &#x2717; ABSENT
      </Button>
      <Button
        variant="outlined"
        color="success"
        size="large"
        disabled={disabled}
        onClick={() => onAnswer('fake')}
        sx={{
          flex: 1,
          maxWidth: 220,
          fontSize: '1rem',
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        }}
      >
        &#x2713; PRESENT
      </Button>
    </Box>
  );
}

function FeedbackPanel({ correct, isReal, children }) {
  return (
    <Fade in timeout={300}>
      <Card
        sx={{
          mt: 2,
          bgcolor: correct ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          border: 1,
          borderColor: correct ? 'success.main' : 'error.main',
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2 }}>
          {correct
            ? <CheckCircleIcon color="success" />
            : <CancelIcon color="error" />
          }
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {correct ? 'Correct!' : 'Not quite!'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {children}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

export default function Tutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState(null);

  // Step 1: Reference image
  if (step === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, pt: 4 }}>
        <StepDots current={0} total={3} />
        <Typography variant="h5" mb={2} textAlign="center">
          Common Colorization Artifacts
        </Typography>

        <Box
          component="img"
          src="/tutorial/imageArtifacts.png"
          alt="Colorization artifact types"
          sx={{
            width: '100%',
            maxWidth: 700,
            borderRadius: 2,
            mb: 2,
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
          {ARTIFACT_CHIPS.map((label) => (
            <Chip
              key={label}
              label={label}
              variant="outlined"
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            />
          ))}
        </Box>

        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={600} mb={3}>
          You'll see 50 images. Some may have colorization artifacts, some won't.
          Your job: decide whether artifacts are present or absent.
        </Typography>

        <Button variant="contained" onClick={() => setStep(1)}>
          Got it &rarr;
        </Button>
      </Box>
    );
  }

  // Step 2: Practice REAL
  if (step === 1) {
    const isCorrect = practiceAnswer === 'real';
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, pt: 4 }}>
        <StepDots current={1} total={3} />
        <Typography variant="h5" mb={2} textAlign="center">
          Are colorization artifacts present or absent?
        </Typography>

        <Box
          component="img"
          src="/images/gt/standard/coco/000000000019.jpg"
          alt="Practice - real"
          sx={{
            width: '100%',
            maxWidth: 600,
            maxHeight: '50vh',
            objectFit: 'contain',
            borderRadius: 2,
            mb: 2,
            bgcolor: '#000',
          }}
        />

        {!practiceAnswer && (
          <AnswerButtons onAnswer={(ans) => setPracticeAnswer(ans)} disabled={false} />
        )}

        {practiceAnswer && (
          <>
            <FeedbackPanel correct={isCorrect} isReal>
              {isCorrect
                ? 'Correct — no artifacts. Natural color gradients and consistent shadows throughout.'
                : 'No artifacts here — natural color gradients and accurate shadows throughout.'}
            </FeedbackPanel>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => { setPracticeAnswer(null); setStep(2); }}
            >
              Next &rarr;
            </Button>
          </>
        )}
      </Box>
    );
  }

  // Step 3: Practice FAKE
  if (step === 2) {
    const isCorrect = practiceAnswer === 'fake';
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, pt: 4 }}>
        <StepDots current={2} total={3} />
        <Typography variant="h5" mb={2} textAlign="center">
          Are colorization artifacts present or absent?
        </Typography>

        <Box
          component="img"
          src="/images/bigcolor/standard/coco/000000000001_c468.jpg"
          alt="Practice - fake"
          sx={{
            width: '100%',
            maxWidth: 600,
            maxHeight: '50vh',
            objectFit: 'contain',
            borderRadius: 2,
            mb: 2,
            bgcolor: '#000',
          }}
        />

        {!practiceAnswer && (
          <AnswerButtons onAnswer={(ans) => setPracticeAnswer(ans)} disabled={false} />
        )}

        {practiceAnswer && (
          <>
            <FeedbackPanel correct={isCorrect} isReal={false}>
              {isCorrect
                ? 'Artifacts present — color bleeding across object edges is the giveaway.'
                : 'Artifacts are present here — look for unnatural color spilling across edges.'}
            </FeedbackPanel>

            <Card sx={{ mt: 2, p: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, px: 1 }}>
                Artifact type: Color bleeding
              </Typography>
              <Box
                component="img"
                src="/tutorial/imageArtifacts.png"
                alt="Artifact reference"
                sx={{ width: '100%', maxWidth: 300, borderRadius: 1 }}
              />
            </Card>

            <Button
              variant="contained"
              sx={{ mt: 2, mb: 4 }}
              onClick={() => navigate('/trial')}
            >
              Start the test (50 images) &rarr;
            </Button>
          </>
        )}
      </Box>
    );
  }

  return null;
}
