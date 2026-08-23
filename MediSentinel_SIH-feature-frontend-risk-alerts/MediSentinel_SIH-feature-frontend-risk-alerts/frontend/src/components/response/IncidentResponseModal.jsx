import React, { useState } from 'react';
import { useRisk } from '../../context/useRisk';
import {
  Send,
  X,
  CheckCircle,
  Radio,
  Copy,
  Check,
} from 'lucide-react';

export default function IncidentResponseModal({ isOpen, onClose, targetAlert }) {
  const { dispatchRRT, addNotification } = useRisk();
  const [activeTab, setActiveTab] = useState('rrt'); // 'rrt' | 'advisory'
  const [selectedLang, setSelectedLang] = useState('english'); // 'english' | 'odia' | 'hindi'
  const [isCopied, setIsCopied] = useState(false);
  const [isBroadcasted, setIsBroadcasted] = useState(false);
  const [priority, setPriority] = useState('CRITICAL');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([
    'Field Epidemiologist',
    'Community Health Officer',
    'Water & Sanitation Inspector',
    '2x ASHA Mobile Workers',
  ]);

  if (!isOpen || !targetAlert) return null;

  const wardName = targetAlert.areaName || 'Ward 12 - Saheed Nagar';

  const defaultAdvisories = {
    english: {
      title: `Public Health Advisory: Vector-Borne Anomaly in ${wardName}`,
      body: `Surveillance has detected elevated fever and syndromic indicators in ${wardName}. Residents are advised to eliminate standing water, utilize mosquito repellents, and visit the nearest Urban Primary Health Center (UPHC) if experiencing persistent fever.`,
      precautions: [
        'Inspect and empty all indoor/outdoor water containers.',
        'Do not consume self-medicated antibiotics or painkillers without prescription.',
        'Report uncollected waste or waterlogging to BMC Helpline: 1929.',
      ],
    },
    odia: {
      title: `ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା: ${wardName} ରେ ସନ୍ଦିଗ୍ଧ ସଂକ୍ରମଣ ବୃଦ୍ଧି ସୂଚନା`,
      body: `ମେଡିସେଣ୍ଟିନେଲ୍ ସର୍ଭେଲାନ୍ସ ଦ୍ୱାରା ${wardName} ଅଞ୍ଚଳରେ ଜ୍ୱର ଓ ଲକ୍ଷଣ ବୃଦ୍ଧି ଚିହ୍ନଟ ହୋଇଛି। ସମସ୍ତ ନାଗରିକଙ୍କୁ ଜମି ରହିଥିବା ପାଣି ନଷ୍ଟ କରିବାକୁ ଏବଂ ଜ୍ୱର ହେଲେ ନିକଟସ୍ଥ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯିବାକୁ ଅନୁରୋଧ।`,
      precautions: [
        'ଘର ଚାରିପାଖେ ପାଣି ଜମିବାକୁ ଦିଅନ୍ତୁ ନାହିଁ।',
        'ବିନା ଡାକ୍ତରୀ ପରାମର୍ଶରେ ଔଷଧ ସେବନ କରନ୍ତୁ ନାହିଁ।',
        'ଜରୁରୀ ସହାୟତା ପାଇଁ ବିଏମସି ହେଲ୍ପଲାଇନ୍ ୧୯୨୯ କୁ ଫୋନ୍ କରନ୍ତୁ।',
      ],
    },
    hindi: {
      title: `जन स्वास्थ्य चेतावनी: ${wardName} में संक्रमण के बढ़े हुए संकेत`,
      body: `मेडीसेंटिनल सर्विलांस द्वारा ${wardName} में बुखार और संबंधित लक्षणों में वृद्धि दर्ज की गई है। नागरिकों से अपील है कि वे जलजमाव न होने दें और लक्षण दिखने पर नजदीकी प्राथमिक स्वास्थ्य केंद्र पर जांच कराएं।`,
      precautions: [
        'कुलर व गमलों में जमा पानी तुरंत खाली करें।',
        'बिना डॉक्टरी सलाह के दवाइयों का सेवन न करें।',
        'सहायता हेतु हेल्पलाइन 1929 पर संपर्क करें।',
      ],
    },
  };

  const handleDispatch = () => {
    dispatchRRT({
      alertId: targetAlert.id,
      wardId: targetAlert.areaId,
      wardName: targetAlert.areaName,
      priority,
      teamComposition: selectedTeamMembers,
    });
    onClose();
  };

  const handleCopyAdvisory = () => {
    const adv = defaultAdvisories[selectedLang];
    const text = `${adv.title}\n\n${adv.body}\n\nKey Precautions:\n${adv.precautions.map((p) => `- ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    addNotification('Advisory text copied to clipboard', 'info');
  };

  const handleBroadcast = () => {
    setIsBroadcasted(true);
    addNotification(
      `Public Health SMS Broadcast dispatched to 42,000+ residents in ${wardName}!`,
      'success',
      'Municipal Broadcast Active'
    );
    setTimeout(() => setIsBroadcasted(false), 3000);
  };

  const teamOptions = [
    'Field Epidemiologist',
    'Community Health Officer',
    'Water & Sanitation Inspector',
    '2x ASHA Mobile Workers',
    'Mobile Diagnostic Van',
    'Vector Fogging Crew',
  ];

  const toggleMember = (member) => {
    setSelectedTeamMembers((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Incident Command & Response Action</h3>
              <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold">
                {targetAlert.severity}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Catchment: <strong className="text-slate-800">{wardName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rrt')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'rrt'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send size={14} /> 1. Dispatch Rapid Response Team (RRT)
          </button>
          <button
            onClick={() => setActiveTab('advisory')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'advisory'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio size={14} /> 2. Multilingual Public Advisory
          </button>
        </div>

        {/* Tab 1: RRT Dispatch */}
        {activeTab === 'rrt' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Deployment Priority</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="CRITICAL">Critical (Immediate 2-Hour Dispatch)</option>
                  <option value="HIGH">High (Within 6 Hours)</option>
                  <option value="ROUTINE">Routine (Next Operational Cycle)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Unit Personnel Composition:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {teamOptions.map((opt) => {
                    const isChecked = selectedTeamMembers.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMember(opt)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left border transition cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check size={10} />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SOP Protocol Steps */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <CheckCircle size={15} className="text-emerald-600" />
                Automated Standard Operating Procedure (SOP) Protocol:
              </div>
              <ul className="text-slate-700 space-y-1 pl-4 list-disc text-[11px]">
                <li>Door-to-door syndromic fever screening across 50 sample households in {wardName}.</li>
                <li>Chlorine residual & bacterial water testing at local municipal supply points.</li>
                <li>Cross-match POS OTC anti-infective sales logs with registered neighborhood chemists.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                className="flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Send size={13} /> Authorize & Dispatch RRT
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Multilingual Advisory */}
        {activeTab === 'advisory' && (
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Target Language:</span>
              <div className="flex gap-1.5 text-xs">
                {['english', 'odia', 'hindi'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1 rounded-lg border font-medium capitalize cursor-pointer transition ${
                      selectedLang === lang
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Advisory Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-slate-900 text-xs">
                {defaultAdvisories[selectedLang].title}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {defaultAdvisories[selectedLang].body}
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                <span className="font-semibold text-slate-800">Public Guidelines:</span>
                <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc pl-4">
                  {defaultAdvisories[selectedLang].precautions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={handleCopyAdvisory}
                className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-3 py-2 rounded-lg transition cursor-pointer"
              >
                {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {isCopied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>

              <button
                onClick={handleBroadcast}
                disabled={isBroadcasted}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Radio size={13} /> {isBroadcasted ? 'Broadcasting...' : 'Simulate SMS/WhatsApp Broadcast'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
