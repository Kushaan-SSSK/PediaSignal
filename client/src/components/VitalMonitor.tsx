import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface VitalsData {
  heartRate: number;
  temperature: number;
  respRate: number;
  bloodPressure?: string;
  oxygenSat?: number;
}

interface VitalMonitorProps {
  vitals: VitalsData;
  isActive?: boolean;
}

export default function VitalMonitor({ vitals, isActive = false }: VitalMonitorProps) {
  const [animatedVitals, setAnimatedVitals] = useState(vitals);

  useEffect(() => {
    setAnimatedVitals(vitals);
  }, [vitals]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setAnimatedVitals(prev => ({
        ...prev,
        heartRate: prev.heartRate + (Math.random() - 0.5) * 10,
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        respRate: prev.respRate + (Math.random() - 0.5) * 4,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getHeartRateStatus = (hr: number) => {
    if (hr > 140) return { color: "text-red-400", bg: "bg-red-400", level: "High" };
    if (hr < 90) return { color: "text-blue-400", bg: "bg-blue-400", level: "Low" };
    return { color: "text-green-400", bg: "bg-green-400", level: "Normal" };
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp > 101) return { color: "text-red-400", bg: "bg-red-400", level: "Fever" };
    if (temp < 97) return { color: "text-blue-400", bg: "bg-blue-400", level: "Low" };
    return { color: "text-green-400", bg: "bg-green-400", level: "Normal" };
  };

  const getRespRateStatus = (rr: number) => {
    if (rr > 30) return { color: "text-amber-400", bg: "bg-amber-400", level: "High" };
    if (rr < 15) return { color: "text-blue-400", bg: "bg-blue-400", level: "Low" };
    return { color: "text-green-400", bg: "bg-green-400", level: "Normal" };
  };

  const hrStatus = getHeartRateStatus(animatedVitals.heartRate);
  const tempStatus = getTemperatureStatus(animatedVitals.temperature);
  const rrStatus = getRespRateStatus(animatedVitals.respRate);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Patient Vitals</h4>
      
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Heart Rate</span>
            <span className={`text-2xl font-bold ${hrStatus.color} ${isActive ? 'vital-pulse' : ''}`}>
              {Math.round(animatedVitals.heartRate)} BPM
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`${hrStatus.bg} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(10, (animatedVitals.heartRate / 180) * 100))}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{hrStatus.level}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Temperature</span>
            <span className={`text-2xl font-bold ${tempStatus.color}`}>
              {animatedVitals.temperature.toFixed(1)}°F
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`${tempStatus.bg} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(10, ((animatedVitals.temperature - 95) / 10) * 100))}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{tempStatus.level}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Resp Rate</span>
            <span className={`text-2xl font-bold ${rrStatus.color}`}>
              {Math.round(animatedVitals.respRate)}/min
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`${rrStatus.bg} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(10, (animatedVitals.respRate / 50) * 100))}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{rrStatus.level}</div>
        </CardContent>
      </Card>

      {animatedVitals.oxygenSat && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">O2 Sat</span>
              <span className="text-2xl font-bold text-blue-400">
                {animatedVitals.oxygenSat}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${animatedVitals.oxygenSat}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
