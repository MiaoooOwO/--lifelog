import React from 'react';
import { Smile, Frown, Meh, CloudRain, Sun, Zap, Heart } from 'lucide-react';
import { Mood } from '../types';

interface MoodIconProps {
  mood: Mood;
  className?: string;
}

export const MoodIcon: React.FC<MoodIconProps> = ({ mood, className = "w-5 h-5" }) => {
  switch (mood) {
    case Mood.Happy: return <Smile className={`${className} text-yellow-500`} />;
    case Mood.Sad: return <Frown className={`${className} text-blue-500`} />;
    case Mood.Calm: return <Sun className={`${className} text-orange-400`} />;
    case Mood.Anxious: return <CloudRain className={`${className} text-gray-500`} />;
    case Mood.Excited: return <Zap className={`${className} text-purple-500`} />;
    case Mood.Grateful: return <Heart className={`${className} text-pink-500`} />;
    case Mood.Neutral: default: return <Meh className={`${className} text-gray-400`} />;
  }
};
