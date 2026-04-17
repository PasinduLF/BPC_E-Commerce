import { CheckCircle2, Circle } from 'lucide-react';

const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8 py-6 px-4 bg-surface rounded-2xl border border-default">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                
                return (
                    <div key={step} className="flex items-center gap-2">
                        {/* Step Circle */}
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all ${
                                isCompleted
                                    ? 'bg-success border-success text-on-brand'
                                    : isActive
                                    ? 'bg-brand border-brand text-on-brand scale-110'
                                    : 'bg-muted border-default text-secondary'
                            }`}
                        >
                            {isCompleted ? <CheckCircle2 size={20} /> : stepNumber}
                        </div>

                        {/* Step Label */}
                        <div className="hidden md:flex flex-col gap-0.5">
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                                isActive ? 'text-brand' : isCompleted ? 'text-success' : 'text-tertiary'
                            }`}>
                                Step {stepNumber}
                            </span>
                            <span className={`text-sm font-semibold ${
                                isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-secondary'
                            }`}>
                                {step}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className={`hidden md:block h-1 transition-all ${
                                isCompleted ? 'bg-success' : isActive ? 'bg-brand' : 'bg-default'
                            }`} style={{ width: stepNumber < currentStep ? '60px' : '40px' }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
