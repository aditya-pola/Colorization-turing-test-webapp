import { LinearProgress, Box } from '@mui/material';

export default function ProgressBar({ current, total }) {
  const value = total > 0 ? (current / total) * 100 : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(124, 77, 255, 0.15)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            background: 'linear-gradient(90deg, #7C4DFF 0%, #B47CFF 100%)',
          },
        }}
      />
    </Box>
  );
}
