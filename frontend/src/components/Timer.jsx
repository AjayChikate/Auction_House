import { useEffect, useState } from 'react';

const Timer = ({ endTime }) => {
  const calculateTimeLeft = () => {
    const difference = new Date(endTime) - new Date();
    return difference > 0 ? difference : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);


  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className=" space-x-2 p-2 bg-white rounded-lg shadow-lg font-mono font-bold text-red-500 transform transition-colors duration-300 hover:scale-105">
      {formatTime(timeLeft)
        .split('')
        .map((char, index) => (
          <span
            key={index}
            className={`inline-block w-3 text-center ${
              char === ':' ? 'text-gray-400' : 'bg-gray-100 rounded-md animate-pulse'
            }`}
          >
            {char}
          </span>
        ))}
    </div>
  );
};

export default Timer;
