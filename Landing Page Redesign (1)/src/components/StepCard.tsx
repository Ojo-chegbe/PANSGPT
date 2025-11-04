interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center text-center space-y-4 p-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
        <span className="text-primary text-2xl">{number}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
