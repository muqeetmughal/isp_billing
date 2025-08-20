import { useEffect, useState } from "react";

interface CounterCardProps {
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  target: number;
}

const CounterCard: React.FC<CounterCardProps> = ({
  title,
  subtitle,
  color,
  icon,
  target,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000; // 1 second animation
    const step = target / (duration / 16);

    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        clearInterval(interval);
        setCount(target);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
      <h2 className={`text-xl font-semibold ${color}`}>
        {icon} {title}
      </h2>
      <p className="text-3xl font-bold text-gray-900 mt-4">{count}</p>
      <p className="text-gray-600 mt-2 text-sm">{subtitle}</p>
    </div>
  );
};

export default CounterCard;
