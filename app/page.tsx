import { Trophy, Skull, Users, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

export default function HomePage() {
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl mb-10">
            <span className="block">Etobicoke Boys</span>
            <span className="block">Keeper League</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Where Derek's couch is sacred ground.
          </p>
        </div>

        {/* League Stats */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StatCard
              icon={<Users className="h-12 w-12 text-primary" />}
              label="Members"
              value="10"
              description=""
            />
            <StatCard
              icon={<Trophy className="h-12 w-12 text-warning" />}
              label="Champions"
              value="4"
              description=""
            />
            <StatCard
              icon={<Skull className="h-12 w-12 text-destructive" />}
              label="Sneezes"
              value="Infinite"
              description=""
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({ icon, label, value, description }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  description: string 
}) {
  return (
    <div className="text-center group">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-200">
        {icon}
      </div>
      <div className="text-4xl font-bold text-foreground mb-3">{value}</div>
      <div className="text-lg font-semibold text-foreground mb-2">{label}</div>
      <div className="text-base text-muted-foreground">{description}</div>
    </div>
  )
}
