interface TipPillProps {
  icon: React.ReactNode
  text: string
}

export function TipPill({ icon, text }: TipPillProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <p className="text-sm text-foreground/70">{text}</p>
    </div>
  )
}
