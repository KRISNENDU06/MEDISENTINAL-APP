import React from 'react';
import { Sliders, RotateCcw, X } from 'lucide-react';

export default function ModelConfigModal({
  isOpen,
  onClose,
  weights,
  setWeights,
  onReset,
}) {
  if (!isOpen) return null;

  const totalWeight =
    weights.medicine +
    weights.health +
    weights.persistence +
    weights.geographic;

  const handleChange = (key, value) => {
    setWeights((prev) => ({
      ...prev,
      [key]: parseFloat(value),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Risk Weight Model Tuner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Calibrate signal weights for the composite risk scoring algorithm.
          Scores recalculate dynamically across all sectors.
        </p>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">Medicine Demand Weight</span>
              <span className="font-mono text-indigo-600 font-semibold">
                {Math.round(weights.medicine * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.medicine}
              onChange={(e) => handleChange('medicine', e.target.value)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">Health Symptoms Weight</span>
              <span className="font-mono text-teal-600 font-semibold">
                {Math.round(weights.health * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.health}
              onChange={(e) => handleChange('health', e.target.value)}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">Temporal Persistence Weight</span>
              <span className="font-mono text-purple-600 font-semibold">
                {Math.round(weights.persistence * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={weights.persistence}
              onChange={(e) => handleChange('persistence', e.target.value)}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">Geographic Spread Weight</span>
              <span className="font-mono text-rose-600 font-semibold">
                {Math.round(weights.geographic * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={weights.geographic}
              onChange={(e) => handleChange('geographic', e.target.value)}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Total check */}
        <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <span className="text-slate-600">Total Normalized Weight:</span>
          <span
            className={`font-mono font-bold ${
              Math.abs(totalWeight - 1.0) < 0.01
                ? 'text-emerald-600'
                : 'text-amber-600'
            }`}
          >
            {Math.round(totalWeight * 100)}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Apply Calibration
          </button>
        </div>
      </div>
    </div>
  );
}