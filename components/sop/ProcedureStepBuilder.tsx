'use client';

import { useState } from 'react';
import { PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function ProcedureStepBuilder({ steps, onChange }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const addStep = () => {
    const newStep = {
      stepNumber: (steps?.length || 0) + 1,
      title: '',
      description: '',
      checklist: [],
      images: [],
      documents: [],
    };
    onChange([...(steps || []), newStep]);
  };

  const removeStep = (index) => {
    const newSteps = (steps || []).filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    onChange(newSteps);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...(steps || [])];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  const addChecklistItem = (stepIndex) => {
    const step = steps?.[stepIndex] || {};
    const checklist = [...(step.checklist || []), { text: '', isCompleted: false }];
    updateStep(stepIndex, 'checklist', checklist);
  };

  const updateChecklistItem = (stepIndex, itemIndex, text) => {
    const step = steps?.[stepIndex] || {};
    const checklist = [...(step.checklist || [])];
    checklist[itemIndex] = { ...checklist[itemIndex], text };
    updateStep(stepIndex, 'checklist', checklist);
  };

  const removeChecklistItem = (stepIndex, itemIndex) => {
    const step = steps?.[stepIndex] || {};
    const checklist = (step.checklist || []).filter((_, i) => i !== itemIndex);
    updateStep(stepIndex, 'checklist', checklist);
  };

  const toggleExpand = (index) => {
    setExpanded((p) => ({ ...p, [index]: !p[index] }));
  };

  const stepList = steps || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[#374151]">Procedure Steps</label>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {stepList.length === 0 && (
        <p className="text-gray-500 text-sm">Click &quot;Add Step&quot; to add procedure steps.</p>
      )}

      {stepList.map((step, index) => (
        <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleExpand(index)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                {step.stepNumber || index + 1}
              </span>
              <span className="font-medium text-[#111827]">
                {step.title || `Step ${index + 1}`}
              </span>
            </div>
            {expanded[index] !== false ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>

          {(expanded[index] !== false) && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Step Title</label>
                <input
                  type="text"
                  value={step.title || ''}
                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Step title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={step.description || ''}
                  onChange={(e) => updateStep(index, 'description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                  placeholder="Describe this step"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-600">Checklist</label>
                  <button
                    type="button"
                    onClick={() => addChecklistItem(index)}
                    className="text-sm text-black hover:text-gray-700 flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {(step.checklist || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={typeof item === 'object' ? item.text : item}
                        onChange={(e) => updateChecklistItem(index, itemIndex, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="Checklist item"
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index, itemIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove Step
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
