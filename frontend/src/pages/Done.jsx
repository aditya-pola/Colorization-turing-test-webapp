import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Snackbar, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';

// ← Replace this with the deployed Fly.io URL before sharing
const STUDY_URL = 'https://stvident-colorization.hf.space';

export default function Done() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('trials');
    localStorage.removeItem('current_index');
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(STUDY_URL);
      setCopied(true);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = STUDY_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Color Turing Test',
        text: 'Can you spot AI colorization? Take the test!',
        url: STUDY_URL,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

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
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main' }} />

          <Typography variant="h4" textAlign="center" fontWeight={700}>
            All done! Thank you.
          </Typography>

          <Typography variant="body1" color="text.secondary" textAlign="center">
            Your responses have been recorded. You completed 50 trials.
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1, opacity: 0.7 }}>
            This study examines how well AI colorization techniques fool human perception.
          </Typography>

          {/* Share section */}
          <Box
            sx={{
              mt: 2,
              width: '100%',
              borderTop: 1,
              borderColor: 'divider',
              pt: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Know someone who'd like to try? Share the study:
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'grey.900',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                width: '100%',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={handleCopy}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {STUDY_URL}
              </Typography>
              <ContentCopyIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                sx={{ flex: 1 }}
              >
                Copy link
              </Button>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{ flex: 1 }}
              >
                Share
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
